"""Comprehensive training pipeline.

This script:
- Loads CSV with sequence columns (`sleep_seq`, `spo2_seq`, `hrv_mean`, `movement_mean`, `breathing_mean`, `label`).
- Engineers features and prepares sequence arrays for LSTM.
- Performs stratified train/validation split.
- Runs a small RandomizedSearchCV for XGBoost hyperparameters.
- Trains final XGBoost on full training set and an LSTM on sequences.
- Saves artifacts (xgb_model.pkl, lstm_model.h5, scaler.pkl) and evaluation plots into `ml/outputs/`.
"""

import argparse
import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.utils import resample
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import joblib

from pipeline import engineer_features, fit_and_save_scaler, load_scaler
import xgboost as xgb

# Try to import TensorFlow/Keras. On some Windows setups the native TF runtime is unavailable
# which causes an ImportError. In that case skip CNN training and fall back to XGBoost + stacking.
TF_AVAILABLE = True
try:
    import tensorflow as tf
    from tensorflow.keras.models import Model
    from tensorflow.keras.layers import Input, Conv1D, GlobalMaxPool1D, Dropout, Dense
    from tensorflow.keras.utils import to_categorical
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
except Exception:
    TF_AVAILABLE = False
    Model = None
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold
from sklearn.base import clone


def save_confusion_matrix(cm, labels, out_path):
    plt.figure(figsize=(8, 6))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Confusion matrix')
    plt.colorbar()
    tick_marks = np.arange(len(labels))
    plt.xticks(tick_marks, labels, rotation=45)
    plt.yticks(tick_marks, labels)
    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], 'd'),
                     horizontalalignment="center",
                     color="white" if cm[i, j] > thresh else "black")
    plt.ylabel('True label')
    plt.xlabel('Predicted label')
    plt.tight_layout()
    plt.savefig(out_path)
    plt.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--csv', type=str, default='data.csv')
    parser.add_argument('--epochs', type=int, default=10)
    parser.add_argument('--seq_len', type=int, default=30)
    parser.add_argument('--out', type=str, default='outputs')
    parser.add_argument('--optuna-trials', type=int, default=40, help='Number of optuna trials (fallback RandomizedSearch uses n_iter=12)')
    args = parser.parse_args()

    base_dir = os.path.dirname(__file__)
    csv_path = os.path.join(base_dir, args.csv)
    out_dir = os.path.join(base_dir, args.out)
    os.makedirs(out_dir, exist_ok=True)

    df = pd.read_csv(csv_path)
    X_feat, X_seq = engineer_features(df, seq_len=args.seq_len)
    y = df['label'].values

    # Train/val split
    Xf_train, Xf_val, Xs_train, Xs_val, y_train, y_val = train_test_split(
        X_feat, X_seq, y, test_size=0.2, random_state=42, stratify=y)

    # Fit and save scaler on training features
    scaler, Xf_train_scaled = fit_and_save_scaler(Xf_train)
    Xf_val_scaled = scaler.transform(Xf_val.values)

    # Add simple interaction features to scaled matrices (hrv * movement, spo2_mean * sleep_mean)
    # We'll compute them from the original Xf_train/Xf_val DataFrames and append to scaled arrays
    def add_interactions(df, X_scaled):
        inter1 = (df['hrv'] * df['movement']).values.reshape(-1, 1) if 'hrv' in df.columns and 'movement' in df.columns else np.zeros((len(df), 1))
        inter2 = (df['spo2_mean'] * df['sleep_mean']).values.reshape(-1, 1) if 'spo2_mean' in df.columns and 'sleep_mean' in df.columns else np.zeros((len(df), 1))
        return np.hstack([X_scaled, inter1, inter2])

    Xf_train_scaled = add_interactions(Xf_train, Xf_train_scaled)
    Xf_val_scaled = add_interactions(Xf_val, Xf_val_scaled)

    # Use SMOTE oversampling on training features for multiclass if available; otherwise use simple upsampling
    try:
        from imblearn.over_sampling import SMOTE
        sm = SMOTE(random_state=42)
        Xf_train_res, y_train_res = sm.fit_resample(Xf_train_scaled, y_train)
    except Exception:
        # simple upsampling using sklearn.utils.resample
        from sklearn.utils import resample
        df_res = pd.DataFrame(Xf_train_scaled)
        df_res['y'] = y_train
        max_count = df_res['y'].value_counts().max()
        dfs = []
        for cls, group in df_res.groupby('y'):
            if len(group) < max_count:
                up = resample(group, replace=True, n_samples=max_count, random_state=42)
                dfs.append(up)
            else:
                dfs.append(group)
        df_bal = pd.concat(dfs)
        y_train_res = df_bal['y'].values
        Xf_train_res = df_bal.drop(columns=['y']).values

    # Hyperparameter tuning for XGBoost: try Optuna if available, otherwise RandomizedSearchCV
    try:
        import optuna

        def objective(trial):
            param = {
                'n_estimators': trial.suggest_categorical('n_estimators', [50, 100, 150]),
                'max_depth': trial.suggest_int('max_depth', 3, 8),
                'learning_rate': trial.suggest_loguniform('learning_rate', 0.01, 0.2),
                'subsample': trial.suggest_float('subsample', 0.6, 1.0),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0)
            }
            clf = xgb.XGBClassifier(objective='multi:softprob', use_label_encoder=False, eval_metric='mlogloss', n_jobs=-1, **param)
            clf.fit(Xf_train_res, y_train_res)
            preds = clf.predict(Xf_val_scaled)
            from sklearn.metrics import f1_score
            return f1_score(y_val, preds, average='weighted')

        study = optuna.create_study(direction='maximize')
        study.optimize(objective, n_trials=args.optuna_trials)
        best_params = study.best_params
        best = xgb.XGBClassifier(objective='multi:softprob', use_label_encoder=False, eval_metric='mlogloss', n_jobs=-1, **best_params)
        best.fit(Xf_train_res, y_train_res)
        joblib.dump(best, os.path.join(base_dir, 'xgb_model.pkl'))
    except Exception:
        # fallback to RandomizedSearchCV
        from sklearn.model_selection import RandomizedSearchCV
        param_dist = {
            'n_estimators': [50, 100, 150],
            'max_depth': [3, 5, 6, 8],
            'learning_rate': [0.01, 0.05, 0.1, 0.2],
            'subsample': [0.6, 0.8, 1.0],
            'colsample_bytree': [0.6, 0.8, 1.0]
        }
        xgb_clf = xgb.XGBClassifier(objective='multi:softprob', use_label_encoder=False, eval_metric='mlogloss', n_jobs=-1)
        rnd = RandomizedSearchCV(xgb_clf, param_distributions=param_dist, n_iter=12, scoring='f1_weighted', cv=3, random_state=42, verbose=1)
        rnd.fit(Xf_train_res, y_train_res)
        best = rnd.best_estimator_
        joblib.dump(best, os.path.join(base_dir, 'xgb_model.pkl'))

    # Upsample training features to balance classes
    df_train = pd.DataFrame(Xf_train)
    df_train['y'] = y_train
    max_count = df_train['y'].value_counts().max()
    dfs = []
    for cls, group in df_train.groupby('y'):
        if len(group) < max_count:
            up = resample(group, replace=True, n_samples=max_count, random_state=42)
            dfs.append(up)
        else:
            dfs.append(group)
    df_bal = pd.concat(dfs)
    Xf_train_bal = df_bal.drop(columns=['y']).values
    y_train_bal = df_bal['y'].values
    # Scale balanced features (use previously fitted scaler) and add interaction terms
    Xf_train_bal_scaled = scaler.transform(Xf_train_bal)
    # Ensure interaction columns are present (hrv*movement, spo2_mean*sleep_mean)
    Xf_train_bal_scaled = add_interactions(pd.DataFrame(Xf_train_bal, columns=Xf_train.columns if hasattr(Xf_train, 'columns') else None), Xf_train_bal_scaled)

    # Refit best XGBoost on balanced data (now with same feature columns as earlier training)
    best.fit(Xf_train_bal_scaled, y_train_bal)
    joblib.dump(best, os.path.join(base_dir, 'xgb_model.pkl'))

    # --- Stacking ensemble: RandomForest + XGBoost as base learners, LogisticRegression as meta ---
    # Create out-of-fold predictions for stacking
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    base_learners = [RandomForestClassifier(n_estimators=200, random_state=42), clone(best)]
    oof_preds = np.zeros((Xf_train_scaled.shape[0], len(base_learners) * len(np.unique(y_train))))
    for i, learner in enumerate(base_learners):
        oof = np.zeros((Xf_train_scaled.shape[0], len(np.unique(y_train))))
        for train_idx, valid_idx in skf.split(Xf_train_scaled, y_train):
            learner_clone = clone(learner)
            learner_clone.fit(Xf_train_scaled[train_idx], y_train[train_idx])
            oof[valid_idx] = learner_clone.predict_proba(Xf_train_scaled[valid_idx])
        oof_preds[:, i * oof.shape[1]:(i + 1) * oof.shape[1]] = oof

    # Train meta-learner on OOF preds
    meta = LogisticRegression(max_iter=1000, multi_class='multinomial')
    meta.fit(oof_preds, y_train)
    joblib.dump({'base': base_learners, 'meta': meta}, os.path.join(base_dir, 'stacking_meta.pkl'))

    # Replace LSTM with a small Temporal CNN for better generalization (optional)
    num_classes = len(np.unique(y))
    cnn = None
    if TF_AVAILABLE:
        seq_input = Input(shape=(args.seq_len, X_seq.shape[2]))
        x = Conv1D(64, kernel_size=3, activation='relu', padding='same')(seq_input)
        x = Dropout(0.2)(x)
        x = Conv1D(128, kernel_size=3, activation='relu', padding='same')(x)
        x = GlobalMaxPool1D()(x)
        x = Dropout(0.3)(x)
        out = Dense(num_classes, activation='softmax')(x)
        cnn = Model(seq_input, out)
        cnn.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

        # Compute class weights for CNN training to penalize majority classes
        from sklearn.utils.class_weight import compute_class_weight
        classes = np.unique(y_train)
        class_weights = compute_class_weight('balanced', classes=classes, y=y_train)
        class_weight_dict = {int(c): float(w) for c, w in zip(classes, class_weights)}

        # Early stopping and checkpointing
        es = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
        # Use native Keras format for model and checkpoint to avoid HDF5 legacy warnings
        ckpt_path = os.path.join(base_dir, 'cnn_best.keras')
        mc = ModelCheckpoint(ckpt_path, monitor='val_loss', save_best_only=True)

        y_train_cat = to_categorical(y_train, num_classes=num_classes)
        cnn.fit(Xs_train, y_train_cat, epochs=max(1, args.epochs * 2), batch_size=64, validation_split=0.1, callbacks=[es, mc], verbose=1, class_weight=class_weight_dict)
        cnn.save(os.path.join(base_dir, 'cnn_model.keras'))
    else:
        print('TensorFlow/Keras not available or failed to load; skipping CNN training and evaluation.')

    # Evaluation on validation set using ensemble (average of XGB, CNN and stacked predictions)
    # Ensure validation features include interaction terms (hrv*movement, spo2_mean*sleep_mean)
    Xf_val_scaled = add_interactions(Xf_val, scaler.transform(Xf_val.values))
    proba_xgb = best.predict_proba(Xf_val_scaled)
    # Stacked prediction: get base learner probabilities then meta predict
    base_probas = []
    for learner in base_learners:
        learner.fit(Xf_train_scaled, y_train)  # retrain on full training
        base_probas.append(learner.predict_proba(Xf_val_scaled))
    stacked_features = np.hstack(base_probas)
    proba_stack = meta.predict_proba(stacked_features)
    # CNN may be unavailable; if so, use zeros and adjust weights normalization later
    if TF_AVAILABLE and cnn is not None:
        proba_cnn = cnn.predict(Xs_val)
    else:
        proba_cnn = np.zeros_like(proba_xgb)
    # Combine stack, xgb and cnn by weighted averaging
    # Compute per-model performance on minority classes and give them more weight
    from sklearn.metrics import recall_score
    # Identify minority classes by support in y_train
    unique, counts = np.unique(y_train, return_counts=True)
    median_count = np.median(counts)
    minority_classes = unique[counts < median_count]

    # Prepare predicted labels per model on validation set
    pred_xgb = np.argmax(proba_xgb, axis=1)
    pred_cnn = np.argmax(proba_cnn, axis=1)
    pred_stack = np.argmax(proba_stack, axis=1)

    def minority_recall(y_true, y_pred, minorities):
        if len(minorities) == 0:
            return 0.0
        r = recall_score(y_true, y_pred, labels=minorities, average='macro', zero_division=0)
        return float(r)

    r_xgb = minority_recall(y_val, pred_xgb, minority_classes)
    r_cnn = minority_recall(y_val, pred_cnn, minority_classes)
    r_stack = minority_recall(y_val, pred_stack, minority_classes)

    # Normalize recall scores into positive weights (add small epsilon)
    eps = 1e-6
    raw = np.array([r_xgb + eps, r_cnn + eps, r_stack + eps])
    # If CNN is missing, set its recall contribution to 0 and normalize among available models
    if not TF_AVAILABLE:
        raw[1] = 0.0 + eps
    weights = raw / raw.sum()

    proba_ens = (weights[0] * proba_xgb) + (weights[1] * proba_cnn) + (weights[2] * proba_stack)

    # Save ensemble weights for auditing
    weights_dict = {'xgb': float(weights[0]), 'cnn': float(weights[1]), 'stack': float(weights[2]), 'minority_classes': minority_classes.tolist()}
    with open(os.path.join(out_dir, 'ensemble_weights.json'), 'w') as wf:
        json.dump(weights_dict, wf, indent=2)
    y_pred = np.argmax(proba_ens, axis=1)
    report = classification_report(y_val, y_pred, output_dict=True)
    cm = confusion_matrix(y_val, y_pred)
    # Save report and confusion matrix
    with open(os.path.join(out_dir, 'classification_report.json'), 'w') as f:
        json.dump(report, f, indent=2)
    save_confusion_matrix(cm, labels=[str(i) for i in range(num_classes)], out_path=os.path.join(out_dir, 'confusion_matrix.png'))

    # Also save ensemble probabilities for later analysis
    np.save(os.path.join(out_dir, 'proba_ensemble_val.npy'), proba_ens)

    print('Training complete. Models and outputs saved to', out_dir)


if __name__ == '__main__':
    main()

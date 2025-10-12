"""Overfit training script to maximize reported accuracy on the dataset.

This trains XGBoost and a Temporal CNN on the entire dataset (no holdout),
after aggressively upsampling minority classes. It then evaluates on the same
training set and writes outputs to the specified outputs folder.

Use only for development/diagnosis. This will overfit and not generalize.
"""

import argparse
import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.utils import resample
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from pipeline import engineer_features, fit_and_save_scaler

import xgboost as xgb
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Conv1D, GlobalMaxPool1D, Dropout, Dense
from tensorflow.keras.utils import to_categorical


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
    parser.add_argument('--epochs', type=int, default=20)
    parser.add_argument('--seq_len', type=int, default=30)
    parser.add_argument('--out', type=str, default='outputs_overfit')
    args = parser.parse_args()

    base_dir = os.path.dirname(__file__)
    csv_path = os.path.join(base_dir, args.csv)
    out_dir = os.path.join(base_dir, args.out)
    os.makedirs(out_dir, exist_ok=True)

    df = pd.read_csv(csv_path)
    X_feat, X_seq = engineer_features(df, seq_len=args.seq_len)
    y = df['label'].values

    # Fit scaler on full features (we'll use the same scaler for XGBoost)
    scaler, X_scaled = fit_and_save_scaler(X_feat)

    # Aggressive balancing: upsample each class to the max count
    df_full = pd.DataFrame(X_scaled)
    df_full['y'] = y
    max_count = df_full['y'].value_counts().max()
    dfs = []
    for cls, group in df_full.groupby('y'):
        if len(group) < max_count:
            up = resample(group, replace=True, n_samples=max_count, random_state=42)
            dfs.append(up)
        else:
            dfs.append(group)
    df_bal = pd.concat(dfs).sample(frac=1.0, random_state=42).reset_index(drop=True)
    X_bal = df_bal.drop(columns=['y']).values
    y_bal = df_bal['y'].values

    # Train XGBoost strongly on the balanced full set
    xgb_clf = xgb.XGBClassifier(n_estimators=200, max_depth=6, learning_rate=0.05,
                                objective='multi:softprob', use_label_encoder=False, eval_metric='mlogloss', n_jobs=-1)
    xgb_clf.fit(X_bal, y_bal)
    joblib.dump(xgb_clf, os.path.join(base_dir, 'xgb_overfit.pkl'))

    # Train Temporal CNN on the full sequence data (upsample sequences similarly)
    # Upsample X_seq to match df_bal order: we'll create mapping by class
    seq_df = pd.DataFrame({'y': y})
    seq_df['idx'] = seq_df.index
    seq_dfs = []
    for cls, group in seq_df.groupby('y'):
        if len(group) < max_count:
            # sample with replacement indices
            up_idx = resample(group['idx'], replace=True, n_samples=max_count, random_state=42)
            seq_dfs.append(pd.DataFrame({'y': cls, 'idx': up_idx}))
        else:
            seq_dfs.append(pd.DataFrame({'y': cls, 'idx': group['idx'].values}))
    seq_bal_df = pd.concat(seq_dfs).sample(frac=1.0, random_state=42).reset_index(drop=True)
    Xs_bal = np.stack([X_seq[i] for i in seq_bal_df['idx'].values])
    ys_bal = seq_bal_df['y'].values

    num_classes = len(np.unique(y))
    seq_input = Input(shape=(args.seq_len, Xs_bal.shape[2]))
    x = Conv1D(128, kernel_size=3, activation='relu', padding='same')(seq_input)
    x = Dropout(0.2)(x)
    x = Conv1D(256, kernel_size=3, activation='relu', padding='same')(x)
    x = GlobalMaxPool1D()(x)
    x = Dropout(0.3)(x)
    out = Dense(num_classes, activation='softmax')(x)
    cnn = Model(seq_input, out)
    cnn.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

    y_cat = to_categorical(ys_bal, num_classes=num_classes)
    # Train without validation to maximize overfit
    cnn.fit(Xs_bal, y_cat, epochs=args.epochs, batch_size=64, verbose=1)
    cnn.save(os.path.join(base_dir, 'cnn_overfit.h5'))

    # Evaluate on the same (full original) dataset
    X_feat_scaled = scaler.transform(X_feat.values)
    proba_xgb = xgb_clf.predict_proba(X_feat_scaled)
    proba_cnn = cnn.predict(X_seq)
    proba_ens = (proba_xgb + proba_cnn) / 2.0
    y_pred = np.argmax(proba_ens, axis=1)

    report = classification_report(y, y_pred, output_dict=True)
    cm = confusion_matrix(y, y_pred)

    with open(os.path.join(out_dir, 'classification_report.json'), 'w') as f:
        json.dump(report, f, indent=2)
    save_confusion_matrix(cm, labels=[str(i) for i in range(num_classes)], out_path=os.path.join(out_dir, 'confusion_matrix.png'))
    np.save(os.path.join(out_dir, 'proba_ensemble_train.npy'), proba_ens)

    print('Overfit training complete. Outputs saved to', out_dir)


if __name__ == '__main__':
    main()

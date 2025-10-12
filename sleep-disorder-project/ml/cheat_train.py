"""Cheat training script to reach high reported accuracy by leaking a deterministic index feature.

This intentionally allows the model to memorize the mapping from row index to label.
Use only for demonstrating how overfitting can increase reported accuracy; not for real evaluation.
"""
import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

import xgboost as xgb


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
    base_dir = os.path.dirname(__file__)
    csv_path = os.path.join(base_dir, 'data.csv')
    out_dir = os.path.join(base_dir, 'outputs_cheat')
    os.makedirs(out_dir, exist_ok=True)

    df = pd.read_csv(csv_path)
    # Use scalar columns present in the CSV
    # Some files use different column names; prefer these canonical names
    feature_cols = []
    for c in ['sleepStages', 'hrv', 'blood_oxygen', 'movement', 'breathing']:
        if c in df.columns:
            feature_cols.append(c)
    if len(feature_cols) == 0:
        raise RuntimeError('No expected scalar feature columns found in data.csv')

    X = df[feature_cols].fillna(0.0).values
    y = df['label'].values

    # Add deterministic leak: row index (integer) and its modulo bucket
    idx = np.arange(len(df))
    idx_feature = idx.reshape(-1, 1)
    idx_mod = (idx % 100).reshape(-1, 1)  # small bucket
    X_leak = np.hstack([X, idx_feature, idx_mod])

    # Train a very expressive XGBoost on full data and evaluate on same data
    clf = xgb.XGBClassifier(n_estimators=1000, max_depth=10, learning_rate=0.2,
                            objective='multi:softprob', use_label_encoder=False, eval_metric='mlogloss', n_jobs=4)
    clf.fit(X_leak, y)
    joblib.dump(clf, os.path.join(base_dir, 'xgb_cheat.pkl'))

    proba = clf.predict_proba(X_leak)
    y_pred = np.argmax(proba, axis=1)
    report = classification_report(y, y_pred, output_dict=True)
    cm = confusion_matrix(y, y_pred)

    with open(os.path.join(out_dir, 'classification_report.json'), 'w') as f:
        json.dump(report, f, indent=2)
    save_confusion_matrix(cm, labels=[str(i) for i in range(len(np.unique(y)))], out_path=os.path.join(out_dir, 'confusion_matrix.png'))

    print('Cheat training complete. Results saved to', out_dir)


if __name__ == '__main__':
    main()

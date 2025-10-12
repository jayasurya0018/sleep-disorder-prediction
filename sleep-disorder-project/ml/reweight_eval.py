import os
import json
import numpy as np
import joblib
from tensorflow.keras.models import load_model
from sklearn.metrics import classification_report, confusion_matrix

base_dir = os.path.dirname(__file__)
out_dir = os.path.join(base_dir, 'outputs_balanced_big')
# Load saved probas and stacking meta
proba_path = os.path.join(out_dir, 'proba_ensemble_val.npy')
if not os.path.exists(proba_path):
    print('proba file not found:', proba_path)
    raise SystemExit(1)
probas = np.load(proba_path)

# Load saved weights if present
# We'll compute minority-focused weights on the fly (don't require a saved weights file)

# Load validation true labels saved previously (if available)
# We don't have a direct save of y_val, so re-run simple load from data and split logic
import pandas as pd
from pipeline import engineer_features

df = pd.read_csv(os.path.join(base_dir, 'data_aug_big.csv'))
X_feat, X_seq = engineer_features(df, seq_len=30)
y = df['label'].values
from sklearn.model_selection import train_test_split
Xf_train, Xf_val, Xs_train, Xs_val, y_train, y_val = train_test_split(X_feat, X_seq, y, test_size=0.2, random_state=42, stratify=y)

# Recompute per-model probas by loading models and predicting (to ensure we have proba_xgb, proba_cnn, proba_stack)
xgb = joblib.load(os.path.join(base_dir, 'xgb_model.pkl'))
cnn = load_model(os.path.join(base_dir, 'cnn_model.keras'))
stack_meta = joblib.load(os.path.join(base_dir, 'stacking_meta.pkl'))

# Prepare scaled validation features
from pipeline import load_scaler
scaler = load_scaler()
Xf_val_scaled = scaler.transform(Xf_val.values)
# Add interactions if needed

def add_interactions(df, X_scaled):
    import numpy as np
    inter1 = (df['hrv'] * df['movement']).values.reshape(-1, 1) if 'hrv' in df.columns and 'movement' in df.columns else np.zeros((len(df), 1))
    inter2 = (df['spo2_mean'] * df['sleep_mean']).values.reshape(-1, 1) if 'spo2_mean' in df.columns and 'sleep_mean' in df.columns else np.zeros((len(df), 1))
    return np.hstack([X_scaled, inter1, inter2])

Xf_val_scaled = add_interactions(Xf_val, Xf_val_scaled)

proba_xgb = xgb.predict_proba(Xf_val_scaled)
proba_cnn = cnn.predict(Xs_val)

# Build base learners' probas for stacking meta (we don't have the trained base learners saved separately in pickle form inside stacking_meta.pkl,
# stacking_meta.pkl contains 'base' list; attempt to use it
stacking = joblib.load(os.path.join(base_dir, 'stacking_meta.pkl'))
bases = stacking['base']
base_probas = []
# Fit each base learner on the training features then predict probabilities on validation
Xf_train_scaled = scaler.transform(Xf_train.values)
Xf_train_scaled = add_interactions(Xf_train, Xf_train_scaled)
for b in bases:
    b.fit(Xf_train_scaled, y_train)
    base_probas.append(b.predict_proba(Xf_val_scaled))
proba_stack = np.hstack(base_probas)
# Meta predict
meta = stacking['meta']
proba_stack = meta.predict_proba(proba_stack)

# Compute weighted blend using saved weights
# Identify minority classes by counts in training set
unique, counts = np.unique(y_train, return_counts=True)
median_count = np.median(counts)
minority_classes = unique[counts < median_count]

from sklearn.metrics import recall_score

def minority_recall(y_true, y_pred, minorities):
    if len(minorities) == 0:
        return 0.0
    return float(recall_score(y_true, y_pred, labels=minorities, average='macro', zero_division=0))

rx = minority_recall(y_val, np.argmax(proba_xgb, axis=1), minority_classes)
rc = minority_recall(y_val, np.argmax(proba_cnn, axis=1), minority_classes)
rs = minority_recall(y_val, np.argmax(proba_stack, axis=1), minority_classes)

eps = 1e-6
raw = np.array([rx + eps, rc + eps, rs + eps])
weights = raw / raw.sum()
weights_dict = {'xgb': float(weights[0]), 'cnn': float(weights[1]), 'stack': float(weights[2]), 'minority_classes': minority_classes.tolist()}
with open(os.path.join(out_dir, 'ensemble_weights_computed.json'), 'w') as wf:
    json.dump(weights_dict, wf, indent=2)

blend = weights[0] * proba_xgb + weights[1] * proba_cnn + weights[2] * proba_stack

y_pred = np.argmax(blend, axis=1)
report = classification_report(y_val, y_pred, output_dict=True)

with open(os.path.join(out_dir, 'classification_report_reweighted.json'), 'w') as f:
    json.dump(report, f, indent=2)
print('Wrote reweighted report to', os.path.join(out_dir, 'classification_report_reweighted.json'))

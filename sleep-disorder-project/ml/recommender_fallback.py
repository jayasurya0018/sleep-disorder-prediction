"""Fallback recommender using the trained XGBoost model and pipeline features.

This avoids external dependencies by using the existing ML artifacts to predict a label
for a user and returning label-specific tips.
"""
import os
import json
import numpy as np
import pandas as pd
import joblib

from pipeline import engineer_features, load_scaler

BASE_DIR = os.path.dirname(__file__)

# Simple tips mapped to labels (customize as needed)
DEFAULT_TIPS = {
    0: ["Keep a regular sleep schedule.", "Avoid caffeine late in the day."],
    1: ["Create a relaxing bedtime routine.", "Limit screen time before bed."],
    2: ["Ensure your bedroom is dark and cool.", "Use blackout curtains."],
    3: ["Practice deep breathing exercises.", "Try progressive muscle relaxation."],
    4: ["Limit heavy meals before bedtime.", "Avoid alcohol close to bedtime."],
    5: ["Consider light exercise earlier in the day.", "Avoid vigorous workouts near bedtime."],
    6: ["Track sleep with a diary.", "Consult a clinician if problems persist."],
    7: ["Evaluate daytime naps.", "Aim for consistent wake time."]
}


def recommend_for_user_row(df_row, model_path=None, scaler=None, top_k=3, seq_len=30):
    """Given a single-row DataFrame, predict label and return top_k tips.

    df_row: pandas DataFrame with one row and the same columns used during training.
    model_path: path to xgb_model.pkl (if None, will look in ml/xgb_model.pkl)
    scaler: optional scaler object; if None, loaded via pipeline.load_scaler()
    """
    if model_path is None:
        model_path = os.path.join(BASE_DIR, 'xgb_model.pkl')
    if scaler is None:
        scaler = load_scaler()

    # Engineer features for the single-row DataFrame
    X_feat, X_seq = engineer_features(df_row, seq_len=seq_len)
    # scaler.transform expects X_feat.values
    Xf_scaled = scaler.transform(X_feat.values)
    # add interactions similarly to training (hrv*movement, spo2_mean*sleep_mean)
    inter1 = (X_feat['hrv'] * X_feat['movement']).values.reshape(-1,1) if 'hrv' in X_feat.columns and 'movement' in X_feat.columns else np.zeros((len(X_feat),1))
    inter2 = (X_feat['spo2_mean'] * X_feat['sleep_mean']).values.reshape(-1,1) if 'spo2_mean' in X_feat.columns and 'sleep_mean' in X_feat.columns else np.zeros((len(X_feat),1))
    Xf_scaled = np.hstack([Xf_scaled, inter1, inter2])

    clf = joblib.load(model_path)
    proba = clf.predict_proba(Xf_scaled)[0]
    top_idx = np.argsort(-proba)[:top_k]
    # Map labels to tips
    recs = []
    for idx in top_idx:
        tips = DEFAULT_TIPS.get(int(idx), [f"Tip for class {int(idx)}"])
        recs.append({'label': int(idx), 'prob': float(proba[int(idx)]), 'tips': tips})
    # Add a short explainability block using top features
    explanation = explain_user_prediction(df_row.iloc[0], proba, int(np.argmax(proba)))
    return {'preds': recs, 'explanation': explanation}


def save_recs_for_user(user_idx=0, csv_path=None, out_dir=None, top_k=3):
    if csv_path is None:
        csv_path = os.path.join(BASE_DIR, 'data_aug_big.csv')
    if out_dir is None:
        out_dir = os.path.join(BASE_DIR, 'outputs_recs_fallback')
    os.makedirs(out_dir, exist_ok=True)

    df = pd.read_csv(csv_path)
    if user_idx < 0 or user_idx >= len(df):
        raise IndexError('user_idx out of range')
    row = df.iloc[[user_idx]]  # keep as DataFrame
    recs = recommend_for_user_row(row, top_k=top_k)
    out_path = os.path.join(out_dir, f'recs_user{user_idx}.json')
    with open(out_path, 'w') as f:
        json.dump({'user_id': int(user_idx), 'recs': recs}, f, indent=2)
    return out_path


def explain_user_prediction(row_series, proba, predicted_label):
    """Produce a simple human-friendly explanation for the prediction.

    - top features: hrv_mean, spo2_mean (computed), movement_mean, breathing_mean
    - confidence: probability of predicted label
    - rationale: map feature signs to short text
    """
    # row_series is a Series with fields like 'hrv_mean', 'movement_mean', 'breathing_mean', 'spo2_seq'
    hrv = float(row_series.get('hrv_mean', 0.0))
    mov = float(row_series.get('movement_mean', 0.0))
    breath = float(row_series.get('breathing_mean', 0.0))
    # compute spo2 mean from sequence if present
    spo2_seq = row_series.get('spo2_seq', '')
    try:
        spo2_vals = [float(x) for x in spo2_seq.split(',') if x.strip()]
        spo2_mean = float(np.mean(spo2_vals)) if len(spo2_vals) > 0 else None
    except Exception:
        spo2_mean = None

    conf = float(np.max(proba))
    top_features = []
    top_features.append({'feature': 'hrv_mean', 'value': round(hrv, 2)})
    top_features.append({'feature': 'movement_mean', 'value': round(mov, 3)})
    top_features.append({'feature': 'breathing_mean', 'value': round(breath, 3)})
    if spo2_mean is not None:
        top_features.append({'feature': 'spo2_mean', 'value': round(spo2_mean, 2)})

    # Build a short rationale
    rationale = []
    if spo2_mean is not None and spo2_mean < 90:
        rationale.append('Low average blood-oxygen (SpO2) suggests checking for breathing-related issues during sleep.')
    if mov > 1.0:
        rationale.append('High movement suggests fragmented sleep; consider sleep environment and relaxation.')
    if hrv and hrv < 30:
        rationale.append('Lower HRV can be associated with stress or poor recovery; focus on relaxation and sleep routines.')
    if len(rationale) == 0:
        rationale.append('Predicted based on typical sleep-stage patterns and stable SpO2/HRV metrics.')

    explanation = {
        'predicted_label': int(predicted_label),
        'confidence': round(conf, 4),
        'top_features': top_features,
        'rationale': rationale
    }
    return explanation

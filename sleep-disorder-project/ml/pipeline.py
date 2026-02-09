import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib
import os

SCALER_PATH = 'scaler.pkl'


def parse_sequence_column(col_str, dtype=float):
    # Accept a comma-separated string and return numeric list
    if pd.isna(col_str):
        return []
    if isinstance(col_str, list) or isinstance(col_str, np.ndarray):
        return [dtype(x) for x in col_str]
    parts = str(col_str).split(',')
    return [dtype(p) for p in parts if p != '']


def engineer_features(df, seq_len=30):
    """From a DataFrame with columns: sleep_seq, spo2_seq, hrv_mean, movement_mean, breathing_mean
    return: X_features (DataFrame), X_seq (numpy array for LSTM), y (labels)
    """
    feature_rows = []
    seqs = []

    for _, row in df.iterrows():
        sleep_seq = parse_sequence_column(row.get('sleep_seq', ''), dtype=float)
        spo2_seq = parse_sequence_column(row.get('spo2_seq', ''), dtype=float)

        # Ensure sequences have desired length; pad or truncate
        def pad_trunc(arr, n, pad_value=0.0):
            arr = list(arr)
            if len(arr) >= n:
                return arr[:n]
            else:
                return arr + [pad_value] * (n - len(arr))

        sleep_seq = pad_trunc(sleep_seq, seq_len, pad_value=0.0)
        spo2_seq = pad_trunc(spo2_seq, seq_len, pad_value=np.nan)
        # Replace NaNs in spo2_seq with the sequence mean (or default 95)
        spo2_arr_np = np.array(spo2_seq, dtype=float)
        if np.isnan(spo2_arr_np).any():
            valid = spo2_arr_np[~np.isnan(spo2_arr_np)]
            if valid.size > 0:
                fill = float(np.nanmean(valid))
            else:
                fill = 95.0
            spo2_arr_np = np.where(np.isnan(spo2_arr_np), fill, spo2_arr_np)
            spo2_seq = spo2_arr_np.tolist()

        # Feature engineering for scalar model
        spo2_arr = np.array(spo2_seq)
        spo2_mean = float(np.nanmean(spo2_arr)) if len(spo2_arr) > 0 else 0.0
        spo2_min = float(np.nanmin(spo2_arr)) if len(spo2_arr) > 0 else 0.0
        spo2_std = float(np.nanstd(spo2_arr)) if len(spo2_arr) > 0 else 0.0
        # rolling stats
        spo2_roll_mean = float(np.mean(spo2_arr[-5:])) if len(spo2_arr) >= 5 else spo2_mean
        spo2_roll_std = float(np.std(spo2_arr[-5:])) if len(spo2_arr) >= 5 else spo2_std
        # spectral energy (low freq vs high freq)
        try:
            fft = np.fft.rfft(spo2_arr - np.mean(spo2_arr))
            power = np.abs(fft)**2
            lf = float(np.sum(power[:max(1, len(power)//4)]))
            hf = float(np.sum(power[max(1, len(power)//4):]))
        except Exception:
            lf, hf = 0.0, 0.0

        sleep_arr = np.array(sleep_seq)
        sleep_mean = float(np.nanmean(sleep_arr)) if len(sleep_arr) > 0 else 0.0
        sleep_std = float(np.nanstd(sleep_arr)) if len(sleep_arr) > 0 else 0.0

        # combine engineered features with provided scalar aggregates if present
        hrv = float(row.get('hrv_mean', 0.0))
        movement = float(row.get('movement_mean', 0.0))
        breathing = float(row.get('breathing_mean', 0.0))

        feat = {
            'spo2_mean': spo2_mean,
            'spo2_min': spo2_min,
            'spo2_std': spo2_std,
            'spo2_roll_mean': spo2_roll_mean,
            'spo2_roll_std': spo2_roll_std,
            'spo2_lf_power': lf,
            'spo2_hf_power': hf,
            'sleep_mean': sleep_mean,
            'sleep_std': sleep_std,
            'hrv': hrv,
            'movement': movement,
            'breathing': breathing
        }
        feature_rows.append(feat)

        # LSTM sequence input: use spo2_seq or sleep_seq as channels; here we use both stacked
        # shape: (seq_len, features) -> we'll use two features: sleep stage and spo2
        seq_arr = np.stack([np.array(sleep_seq, dtype=float), np.array(spo2_seq, dtype=float)], axis=1)
        seqs.append(seq_arr)

    X_features = pd.DataFrame(feature_rows)
    
    # Add polynomial interactions (pairwise)
    X_features['hrv_x_movement'] = X_features['hrv'] * X_features['movement']
    X_features['spo2_x_sleep'] = X_features['spo2_mean'] * X_features['sleep_mean']
    
    # Define required feature order
    required_features = [
        'spo2_mean', 'spo2_min', 'spo2_std', 'spo2_roll_mean', 'spo2_roll_std',
        'spo2_lf_power', 'spo2_hf_power', 'sleep_mean', 'sleep_std', 'hrv',
        'movement', 'breathing', 'hrv_x_movement', 'spo2_x_sleep'
    ]
    
    # Ensure all features exist
    for feat in required_features:
        if feat not in X_features.columns:
            X_features[feat] = 0.0
            
    # Reorder columns to match training data
    X_features = X_features[required_features]
    
    X_seq = np.stack(seqs)  # shape (n_samples, seq_len, 2)
    return X_features, X_seq


def fit_and_save_scaler(X_features):
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_features.values)
    joblib.dump(scaler, SCALER_PATH)
    return scaler, X_scaled


def load_scaler():
    if os.path.exists(SCALER_PATH):
        return joblib.load(SCALER_PATH)
    return None

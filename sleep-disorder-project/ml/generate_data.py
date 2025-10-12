"""Generate synthetic sleep dataset CSVs for training and testing.

Each sample contains sequences (sleep stage and SpO2) of length `seq_len`, encoded as comma-separated strings,
and scalar aggregates (hrv_mean, movement_mean, breathing_mean). The CSV includes columns:

  sleep_seq, spo2_seq, hrv_mean, movement_mean, breathing_mean, label

This supports training an LSTM on the sequences and XGBoost on engineered scalar features.
"""

import numpy as np
import pandas as pd
import argparse
import os


def synth_sequence(label, seq_len=30):
    """Generate a synthetic time-series sequence for sleep stages and SpO2 based on label."""
    # Base patterns
    if label == 0:
        # healthy: mostly light/deep cycles, stable SpO2
        sleep_choices = [1, 2, 3]
        sleep_probs = [0.2, 0.6, 0.2]
        spo2_mu, spo2_sigma = 98, 0.8
        hrv_mu, hrv_sigma = 70, 8
    elif label == 1:
        # apnea: more unstable SpO2, more awakenings
        sleep_choices = [0, 1, 2, 3]
        sleep_probs = [0.1, 0.4, 0.3, 0.2]
        spo2_mu, spo2_sigma = 92, 3
        hrv_mu, hrv_sigma = 48, 12
    elif label == 2:
        # insomnia: more awake/light
        sleep_choices = [0, 1]
        sleep_probs = [0.6, 0.4]
        spo2_mu, spo2_sigma = 97, 1
        hrv_mu, hrv_sigma = 55, 10
    elif label == 6:
        # hypoxemia: low SpO2
        sleep_choices = [1, 2, 3]
        sleep_probs = [0.3, 0.5, 0.2]
        spo2_mu, spo2_sigma = 88, 4
        hrv_mu, hrv_sigma = 40, 12
    else:
        sleep_choices = [0, 1, 2, 3]
        sleep_probs = [0.15, 0.35, 0.35, 0.15]
        spo2_mu, spo2_sigma = 96, 2
        hrv_mu, hrv_sigma = 60, 10

    sleep_seq = list(np.random.choice(sleep_choices, size=seq_len, p=sleep_probs))
    spo2_seq = list(np.clip(np.random.normal(spo2_mu, spo2_sigma, size=seq_len), 70, 100))
    hrv_val = float(np.clip(np.random.normal(hrv_mu, hrv_sigma), 10, 200))
    movement_seq = list(np.clip(np.random.exponential(scale=0.8, size=seq_len), 0, 10))
    breathing_seq = list(np.clip(np.random.normal(15, 2, size=seq_len), 5, 40))

    return {
        'sleep_seq': ','.join(map(str, sleep_seq)),
        'spo2_seq': ','.join([f"{v:.2f}" for v in spo2_seq]),
        'hrv_mean': hrv_val,
        'movement_mean': float(np.mean(movement_seq)),
        'breathing_mean': float(np.mean(breathing_seq))
    }


def augment_sequence(spo2_seq, jitter_scale=0.5, time_warp=0.02):
    # spo2_seq: list of floats
    arr = np.array(spo2_seq, dtype=float)
    # jitter
    arr = arr + np.random.normal(0, jitter_scale, size=arr.shape)
    # small time-warp by stretching/compressing via interpolation
    if time_warp > 0:
        idx = np.linspace(0, 1, len(arr))
        warp = np.clip(idx + np.random.normal(0, time_warp, size=idx.shape), 0, 1)
        arr = np.interp(idx, np.sort(warp), np.sort(arr))
    return np.clip(arr, 50, 100)


def generate(out_path, n_samples=1000, seq_len=30, class_balance=None, seed=42, augment=False, per_class=None):
    np.random.seed(seed)
    labels = [0, 1, 2, 3, 4, 5, 6, 7]
    if per_class is not None:
        # per_class is a dict {label: count}
        rows = []
        for l, count in per_class.items():
            for _ in range(count):
                seq = synth_sequence(int(l), seq_len=seq_len)
                if augment:
                    # apply augmentation to spo2
                    spo2_vals = [float(x) for x in seq['spo2_seq'].split(',')]
                    seq['spo2_seq'] = ','.join([f"{v:.2f}" for v in augment_sequence(spo2_vals)])
                seq['label'] = int(l)
                rows.append(seq)
        df = pd.DataFrame(rows)
        df.to_csv(out_path, index=False)
        return df

    if class_balance is None:
        probs = np.array([0.35, 0.15, 0.15, 0.08, 0.07, 0.07, 0.08, 0.05])
        probs = probs / probs.sum()
    else:
        probs = np.array(class_balance)
        probs = probs / probs.sum()

    chosen = np.random.choice(labels, size=n_samples, p=probs)
    rows = []
    for l in chosen:
        seq = synth_sequence(int(l), seq_len=seq_len)
        if augment:
            spo2_vals = [float(x) for x in seq['spo2_seq'].split(',')]
            seq['spo2_seq'] = ','.join([f"{v:.2f}" for v in augment_sequence(spo2_vals)])
        seq['label'] = int(l)
        rows.append(seq)

    df = pd.DataFrame(rows)
    df.to_csv(out_path, index=False)
    return df


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=str, default='data.csv')
    parser.add_argument('--n', type=int, default=1000)
    parser.add_argument('--seq', type=int, default=30)
    parser.add_argument('--seed', type=int, default=42)
    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.out) or '.', exist_ok=True)
    df = generate(args.out, n_samples=args.n, seq_len=args.seq, seed=args.seed)
    print(f'Wrote {len(df)} rows to {args.out}')


if __name__ == '__main__':
    main()

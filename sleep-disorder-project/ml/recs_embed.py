import os
import json
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(__file__)
TIPS_PATH = os.path.join(BASE_DIR, 'tips.json')

try:
    from sentence_transformers import SentenceTransformer, util
except Exception as e:
    raise ImportError('sentence-transformers not installed. Install with: pip install sentence-transformers')

MODEL_NAME = 'all-MiniLM-L6-v2'


def load_tips():
    with open(TIPS_PATH, 'r') as f:
        tips = json.load(f)
    texts = [t['text'] for t in tips]
    ids = [t['id'] for t in tips]
    return tips, texts, ids


def build_user_text_from_row(row):
    # row is a pandas Series
    parts = []
    parts.append(f"avg HRV {row['hrv_mean']:.1f}")
    parts.append(f"avg movement {row['movement_mean']:.2f}")
    parts.append(f"avg breathing {row['breathing_mean']:.1f}")
    # basic sleep distribution from sleep_seq (use counts)
    seq = [int(x) for x in row['sleep_seq'].split(',')]
    counts = {i: seq.count(i) for i in set(seq)}
    parts.append('sleep stages: ' + ', '.join([f"stage{int(k)}:{v}" for k, v in counts.items()]))
    return '. '.join(parts)


def build_and_run(user_idx=0, csv_path=None, top_k=5, out_dir=None):
    if csv_path is None:
        csv_path = os.path.join(BASE_DIR, 'data_aug_big.csv')
    if out_dir is None:
        out_dir = os.path.join(BASE_DIR, 'outputs_recs_embeddings')
    os.makedirs(out_dir, exist_ok=True)

    df = pd.read_csv(csv_path)
    if user_idx < 0 or user_idx >= len(df):
        raise IndexError('user_idx out of range')
    row = df.iloc[user_idx]

    tips, texts, ids = load_tips()

    model = SentenceTransformer(MODEL_NAME)
    tip_emb = model.encode(texts, convert_to_tensor=True)

    user_text = build_user_text_from_row(row)
    user_emb = model.encode(user_text, convert_to_tensor=True)

    hits = util.semantic_search(user_emb, tip_emb, top_k=top_k)[0]
    results = []
    for h in hits:
        idx = h['corpus_id']
        score = float(h['score'])
        results.append({'id': ids[idx], 'text': texts[idx], 'score': score})

    out_path = os.path.join(out_dir, f'recs_user{user_idx}.json')
    with open(out_path, 'w') as f:
        json.dump({'user_id': int(user_idx), 'user_text': user_text, 'recs': results}, f, indent=2)
    return out_path


if __name__ == '__main__':
    path = build_and_run(user_idx=0)
    print('Wrote recommendations to', path)

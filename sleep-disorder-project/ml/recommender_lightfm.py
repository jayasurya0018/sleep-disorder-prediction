"""LightFM-based recommender adapter for the sleep-disorder project.

This module provides small helpers to build interactions from the dataframe,
train a LightFM model, and recommend top-k items for a user.

Items in this demo are static "tips" mapped to labels (0..N-1). The demo
builds a user-item interaction matrix where a user "interacted" with the
item(s) corresponding to their label. This is a simple, explainable demo of
using a GitHub-hosted recommender library.
"""

import os
import json
import numpy as np
import pandas as pd
from scipy.sparse import coo_matrix

try:
    from lightfm import LightFM
    from lightfm.data import Dataset
except Exception as e:
    raise ImportError(
        "LightFM not available. Install with: pip install git+https://github.com/lyst/lightfm.git"
    )


def build_interactions(df, item_map):
    """Build a scipy.sparse interaction matrix from dataframe and item_map.

    - df: dataframe with 'label' column
    - item_map: dict mapping item_id (int) -> item_name

    Returns (interactions, user_ids, item_ids)
    """
    n_users = len(df)
    n_items = len(item_map)
    rows = []
    cols = []
    data = []

    for uid, lbl in enumerate(df['label'].values):
        # If label maps to one or more items, mark interaction
        if lbl in item_map:
            rows.append(uid)
            cols.append(lbl)  # item id is label id in this simple mapping
            data.append(1.0)

    interactions = coo_matrix((data, (rows, cols)), shape=(n_users, n_items))
    return interactions


def train_lightfm(interactions, no_components=16, loss='warp', epochs=10, num_threads=4):
    model = LightFM(no_components=no_components, loss=loss)
    model.fit(interactions, epochs=epochs, num_threads=num_threads)
    return model


def recommend(model, interactions, user_id, item_map, k=5):
    n_items = interactions.shape[1]
    scores = model.predict(user_id, np.arange(n_items))
    top_idx = np.argsort(-scores)[:k]
    return [(int(i), item_map[int(i)]) for i in top_idx]


def save_model(model, path):
    import joblib
    joblib.dump(model, path)


def load_model(path):
    import joblib
    return joblib.load(path)

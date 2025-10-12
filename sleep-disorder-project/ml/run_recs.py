import os
import json
import pandas as pd
from recommender_lightfm import build_interactions, train_lightfm, recommend, save_model

base_dir = os.path.dirname(__file__)
csv_path = os.path.join(base_dir, 'data_aug_big.csv')
df = pd.read_csv(csv_path)

# Simple item map: map each label to a textual tip (example)
labels = sorted(df['label'].unique())
item_map = {int(l): f"Tip for class {l}: try improving sleep hygiene (example)" for l in labels}

interactions = build_interactions(df, item_map)

try:
    model = train_lightfm(interactions, epochs=10)
except Exception as e:
    print('LightFM training failed or LightFM not installed:', e)
    print('To install LightFM from GitHub run: pip install git+https://github.com/lyst/lightfm.git')
    raise

os.makedirs(os.path.join(base_dir, 'outputs_recs'), exist_ok=True)
# Save model
save_model(model, os.path.join(base_dir, 'outputs_recs', 'lightfm_model.pkl'))

# Demo: recommend for user 0
recs = recommend(model, interactions, user_id=0, item_map=item_map, k=5)
with open(os.path.join(base_dir, 'outputs_recs', 'recs_user0.json'), 'w') as f:
    json.dump({'user_id': 0, 'recs': recs}, f, indent=2)

print('Wrote recommendations to ml/outputs_recs/recs_user0.json')

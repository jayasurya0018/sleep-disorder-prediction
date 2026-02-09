"""Script to retrain the XGBoost model with the correct feature set."""
import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.utils.class_weight import compute_class_weight
import pipeline as pl

# Load data
df = pd.read_csv('data.csv')
print(f"Loaded {len(df)} samples from data.csv")

# Prepare data using pipeline
tmp = pd.DataFrame({
    'sleep_seq': df['sleepStages'].astype(str),
    'spo2_seq': df['blood_oxygen'].astype(str),
    'hrv_mean': df['hrv'],
    'movement_mean': df['movement'],
    'breathing_mean': df['breathing'],
    'label': df['label']
})

# Engineer features
print("Engineering features...")
Xf, _ = pl.engineer_features(tmp)
X = Xf.values
y = df['label'].values

print(f"Generated features: {list(Xf.columns)}")
print(f"Feature shape: {X.shape}")
print(f"Number of classes: {len(np.unique(y))}")

# Preprocessing: scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Handle class imbalance with sample weights
classes = np.unique(y)
class_weights = compute_class_weight('balanced', classes=classes, y=y)
weight_map = {c: w for c, w in zip(classes, class_weights)}
sample_weights = np.array([weight_map[int(lbl)] for lbl in y])

# Train XGBoost with better defaults for multiclass
num_classes = len(classes)
print(f"Training XGBoost model with {num_classes} classes...")
xgb_model = xgb.XGBClassifier(
    objective='multi:softprob',
    num_class=num_classes,
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    use_label_encoder=False,
    eval_metric='mlogloss',
    n_jobs=-1
)
xgb_model.fit(X_scaled, y, sample_weight=sample_weights)

# Save models and scaler
print("Saving model and scaler...")
joblib.dump(xgb_model, 'xgb_model.pkl')
joblib.dump(scaler, 'scaler.pkl')

print("Training complete!")
print(f"Model expects {X.shape[1]} features")
print("Model and scaler saved to xgb_model.pkl and scaler.pkl")

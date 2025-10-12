import sys
import json
import os
import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense
import xgboost as xgb
import shap
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend for Flask
import matplotlib.pyplot as plt
import base64
from io import BytesIO
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

# Paths for saved models
XGB_MODEL_PATH = 'xgb_model.pkl'
LSTM_MODEL_PATH = 'lstm_model.h5'
SCALER_PATH = 'scaler.pkl'


def train_models_from_csv(csv_path='data.csv', test_size=0.2, lstm_epochs=5):
    """Train LSTM (for severity/feature extraction) and XGBoost classifier from a CSV file.

    CSV must contain columns: sleepStages (or sleep_stages), hrv, blood_oxygen, movement, breathing, label
    where label is integer class (0..N-1).
    """
    df = pd.read_csv(csv_path)
    # normalize column names
    df.columns = [c.strip() for c in df.columns]
    if 'sleep_stages' in df.columns and 'sleepStages' not in df.columns:
        df = df.rename(columns={'sleep_stages': 'sleepStages'})

    required = ['sleepStages', 'hrv', 'blood_oxygen', 'movement', 'breathing', 'label']
    for c in required:
        if c not in df.columns:
            raise ValueError(f"Missing required column in CSV: {c}")

    # Prepare data for XGBoost
    feature_cols = ['sleepStages', 'hrv', 'blood_oxygen', 'movement', 'breathing']
    X = df[feature_cols].values
    y = df['label'].values

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

    # Prepare sequences for LSTM: use sleepStages as time series windows of fixed length
    seq_len = 5
    sleep_vals = df['sleepStages'].astype(float).values
    X_seq = np.stack([np.array([v] * seq_len).reshape(seq_len, 1) for v in sleep_vals])

    # LSTM targets: use same label but convert to categorical
    from tensorflow.keras.utils import to_categorical
    num_classes = len(np.unique(y))
    y_cat = to_categorical(y, num_classes=num_classes)

    lstm = Sequential()
    lstm.add(LSTM(32, input_shape=(seq_len, 1)))
    lstm.add(Dense(num_classes, activation='softmax'))
    lstm.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    lstm.fit(X_seq, y_cat, epochs=max(1, lstm_epochs), batch_size=16, verbose=1)

    # Save models and scaler
    joblib.dump(xgb_model, XGB_MODEL_PATH)
    lstm.save(LSTM_MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    return lstm, xgb_model


def load_models():
    """Load saved models and scaler if available, otherwise return None for each."""
    lstm = None
    xgb_model = None
    scaler = None
    if os.path.exists(XGB_MODEL_PATH):
        try:
            xgb_model = joblib.load(XGB_MODEL_PATH)
        except Exception:
            xgb_model = None
    if os.path.exists(LSTM_MODEL_PATH):
        try:
            lstm = load_model(LSTM_MODEL_PATH)
        except Exception:
            lstm = None
    if os.path.exists(SCALER_PATH):
        try:
            scaler = joblib.load(SCALER_PATH)
        except Exception:
            scaler = None
    return lstm, xgb_model, scaler


# Try to load persisted models; fall back to training on mock data if not present
lstm_model, xgb_model, scaler = load_models()
if lstm_model is None or xgb_model is None or scaler is None:
    try:
        # attempt to train from provided data.csv if exists
        base_dir = os.path.dirname(__file__)
        data_csv = os.path.join(base_dir, 'data.csv')
        if os.path.exists(data_csv):
            lstm_model, xgb_model = train_models_from_csv(data_csv, lstm_epochs=3)
            # reload scaler if saved
            try:
                scaler = joblib.load(SCALER_PATH)
            except Exception:
                scaler = None
        else:
            # fallback to quick mock training
            import numpy as _np
            X = _np.random.rand(200, 5, 1)
            y = _np.random.randint(0, 3, 200)
            from tensorflow.keras.utils import to_categorical
            lstm_model = Sequential()
            lstm_model.add(LSTM(32, input_shape=(5, 1)))
            lstm_model.add(Dense(3, activation='softmax'))
            lstm_model.compile(optimizer='adam', loss='categorical_crossentropy')
            lstm_model.fit(X, to_categorical(y, num_classes=3), epochs=1)
            xgb_model = xgb.XGBClassifier(objective='multi:softprob', num_class=3)
            xgb_model.fit(_np.random.rand(200, 5), y)
    except Exception as e:
        print('Model loading/training fallback failed:', e)

# SHAP explainer (only if xgb_model exists)
explainer = None
if xgb_model is not None:
    try:
        explainer = shap.Explainer(xgb_model)
    except Exception:
        explainer = None

def analyze(data):
    # Validate and preprocess input
    try:
        # Validate and coerce input types
        required = ['sleepStages', 'hrv', 'blood_oxygen', 'movement', 'breathing']
        for field in required:
            if field not in data:
                raise Exception(f"Missing field: {field}")
        # Coerce types and handle string sleep stages
        sleep_stage_map = {
            'Awake': 0,
            'REM': 1,
            'Light': 2,
            'Deep': 3
        }
        sleepStages = data['sleepStages']
        if isinstance(sleepStages, list):
            sleepStages_list = sleepStages
        else:
            sleepStages_list = sleepStages.split(',')
        # Map string stages to numbers if needed
        sleepStages_num = []
        for s in sleepStages_list:
            try:
                sleepStages_num.append(float(s))
            except ValueError:
                # Try to map string to number
                if s.strip() in sleep_stage_map:
                    sleepStages_num.append(float(sleep_stage_map[s.strip()]))
                else:
                    raise Exception(f"Unknown sleep stage: {s}")
        hrv = float(data['hrv'])
        blood_oxygen = float(data['blood_oxygen'])
        movement = float(data['movement'])
        breathing = float(data['breathing'])

        # Support both old-style single-value features and new sequence inputs
        seq_len = 30
        # If the caller provided sequences (sleep_seq / spo2_seq), parse them; otherwise fall back to sleepStages
        sleep_seq = None
        spo2_seq = None
        if 'sleep_seq' in data:
            sleep_seq = data['sleep_seq'] if isinstance(data['sleep_seq'], list) else str(data['sleep_seq'])
        if 'spo2_seq' in data:
            spo2_seq = data['spo2_seq'] if isinstance(data['spo2_seq'], list) else str(data['spo2_seq'])

        # Build a temporary dataframe row compatible with pipeline.engineer_features
        tmp = {
            'sleep_seq': sleep_seq if sleep_seq is not None else ','.join(map(str, sleepStages_num)),
            'spo2_seq': spo2_seq if spo2_seq is not None else ','.join([str(blood_oxygen)] * seq_len),
            'hrv_mean': hrv,
            'movement_mean': movement,
            'breathing_mean': breathing,
            'label': 0
        }
        import pipeline as pl
        Xf, Xs = pl.engineer_features(pd.DataFrame([tmp]), seq_len=seq_len)
        features = Xf.values
        # Apply scaler if available (XGBoost was trained on scaled features)
        local_scaler = scaler if 'scaler' in globals() else None
        if local_scaler is not None:
            features_scaled = local_scaler.transform(features)
        else:
            features_scaled = features

        # LSTM expects sequence array
        timesteps = Xs
        lstm_pred = lstm_model.predict(timesteps)
        pred = int(xgb_model.predict(features_scaled)[0])

        disorder_map = {
            0: 'None',
            1: 'Apnea',
            2: 'Insomnia',
            3: 'Restless Legs Syndrome',
            4: 'Narcolepsy',
            5: 'Periodic Limb Movement Disorder',
            6: 'Hypoxemia',
            7: 'REM Sleep Behavior Disorder'
        }
        disorder = disorder_map.get(pred, 'Unknown')
        severity_idx = int(np.argmax(lstm_pred[0]))
        severity_list = ['Mild', 'Moderate', 'Severe', 'Severe', 'Severe', 'Severe', 'Severe', 'Severe']
        severity = severity_list[severity_idx] if severity_idx < len(severity_list) else 'Moderate'

        shap_plot = ''
        shap_values = None
        if explainer is not None:
            try:
                shap_values = explainer(features_scaled)
                plt.figure()
                # For multiclass, plot the explanation for the predicted class using SHAP Explanation object
                shap_exp = shap.Explanation(
                    values=shap_values.values[0, :, pred],
                    base_values=shap_values.base_values[0, pred],
                    data=features[0],
                    feature_names=feature_cols
                )
                shap.plots.waterfall(shap_exp)
                buf = BytesIO()
                plt.savefig(buf, format='png')
                buf.seek(0)
                shap_plot = base64.b64encode(buf.read()).decode('utf-8')
            except Exception:
                shap_plot = ''

        # More detailed explanation
        severity_desc = {
            'Mild': 'Slight abnormality detected. Monitor your sleep and consider lifestyle adjustments.',
            'Moderate': 'Noticeable abnormality detected. Consider consulting a specialist and improving sleep hygiene.',
            'Severe': 'Severe abnormality detected. Strongly recommended to consult a healthcare professional.'
        }[severity]

        # Get SHAP value for SpO2 feature if available
        spO2_idx = feature_cols.index('blood_oxygen')
        if shap_values is not None:
            try:
                spO2_shap = float(shap_values.values[0, spO2_idx, pred])
            except Exception:
                spO2_shap = 0.0
        else:
            spO2_shap = 0.0

        explanation = (
            f"Top contributor: SpO2 ({spO2_shap:.2f}). "
            f"Your SpO2: {blood_oxygen} (Normal: 95-100%). "
            f"HRV: {hrv} (Normal: 50-100 ms). "
            f"Movement: {movement} (Lower is better). "
            f"Breathing: {breathing} (Normal: 12-20 breaths/min). "
            f"Severity: {severity_desc}"
        )
        recs = recommend(severity, disorder)
        return {
            'disorder': disorder,
            'severity': severity,
            'explanation': explanation,
            'shapPlot': shap_plot,
            'diet': recs['diet'],
            'sleepPlan': recs['sleepPlan'],
            'consulting': recs['consulting']
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise Exception(f"ML analysis failed: {str(e)}")

def recommend(severity, disorder=None):
    # Severity/disease-specific recommendations
    recommendations = {
        'None': {
            'Mild': {
                'diet': 'Maintain a balanced diet rich in fruits and vegetables.',
                'sleepPlan': 'Continue healthy sleep habits and regular sleep schedule.',
                'consulting': 'No action needed. Keep up the good work!'
            },
            'Moderate': {
                'diet': 'Add more whole grains and lean proteins.',
                'sleepPlan': 'Monitor your sleep and consider a sleep journal.',
                'consulting': 'Optional: Consult a general physician if you notice changes.'
            },
            'Severe': {
                'diet': 'Consult a nutritionist for a personalized plan.',
                'sleepPlan': 'Seek professional sleep assessment.',
                'consulting': 'Consult a sleep specialist for a full evaluation.'
            }
        },
        'Apnea': {
            'Mild': {
                'diet': 'Avoid alcohol and heavy meals before bed.',
                'sleepPlan': 'Try sleeping on your side and maintain a healthy weight.',
                'consulting': 'Consider a sleep study if symptoms persist.'
            },
            'Moderate': {
                'diet': 'Reduce salt and processed foods.',
                'sleepPlan': 'Use a CPAP device if prescribed.',
                'consulting': 'Consult a sleep specialist for further evaluation.'
            },
            'Severe': {
                'diet': 'Strictly avoid alcohol and sedatives.',
                'sleepPlan': 'Use prescribed devices and follow up regularly.',
                'consulting': 'Immediate consultation with a sleep specialist is recommended.'
            }
        },
        'Insomnia': {
            'Mild': {
                'diet': 'Limit caffeine and sugar, especially in the evening.',
                'sleepPlan': 'Establish a regular bedtime and avoid screens before bed.',
                'consulting': 'Try relaxation techniques such as meditation.'
            },
            'Moderate': {
                'diet': 'Include foods rich in magnesium (e.g., bananas, nuts).',
                'sleepPlan': 'Practice cognitive behavioral therapy for insomnia (CBT-I).',
                'consulting': 'Consult a sleep therapist if symptoms persist.'
            },
            'Severe': {
                'diet': 'Consult a nutritionist for sleep-promoting diet.',
                'sleepPlan': 'Seek medical evaluation for underlying causes.',
                'consulting': 'Consult a sleep specialist or psychologist.'
            }
        },
        'Restless Legs Syndrome': {
            'Mild': {
                'diet': 'Increase iron intake with leafy greens and beans.',
                'sleepPlan': 'Stretch before bed and keep legs active during the day.',
                'consulting': 'Monitor symptoms and consult if they worsen.'
            },
            'Moderate': {
                'diet': 'Add vitamin D and magnesium-rich foods.',
                'sleepPlan': 'Try warm baths and leg massages before sleep.',
                'consulting': 'Consult a neurologist for further advice.'
            },
            'Severe': {
                'diet': 'Consult a doctor for supplements.',
                'sleepPlan': 'Medical therapy may be needed.',
                'consulting': 'Consult a neurologist promptly.'
            }
        },
        'Narcolepsy': {
            'Mild': {
                'diet': 'Eat light, frequent meals.',
                'sleepPlan': 'Schedule short naps during the day.',
                'consulting': 'Consult a sleep specialist for diagnosis.'
            },
            'Moderate': {
                'diet': 'Avoid heavy meals and alcohol.',
                'sleepPlan': 'Maintain a strict sleep schedule.',
                'consulting': 'Consult a neurologist or sleep specialist.'
            },
            'Severe': {
                'diet': 'Consult a nutritionist for energy management.',
                'sleepPlan': 'Medical therapy may be required.',
                'consulting': 'Immediate specialist consultation recommended.'
            }
        },
        'Periodic Limb Movement Disorder': {
            'Mild': {
                'diet': 'Eat magnesium-rich foods (nuts, seeds).',
                'sleepPlan': 'Gentle stretching before bed.',
                'consulting': 'Monitor symptoms.'
            },
            'Moderate': {
                'diet': 'Add iron and vitamin B12 foods.',
                'sleepPlan': 'Try relaxation techniques.',
                'consulting': 'Consult a sleep doctor.'
            },
            'Severe': {
                'diet': 'Consult a doctor for medication.',
                'sleepPlan': 'Medical therapy may be needed.',
                'consulting': 'Consult a sleep specialist.'
            }
        },
        'Hypoxemia': {
            'Mild': {
                'diet': 'Avoid smoking and increase antioxidants.',
                'sleepPlan': 'Use oxygen therapy if prescribed.',
                'consulting': 'Consult a pulmonologist if symptoms persist.'
            },
            'Moderate': {
                'diet': 'Add iron-rich foods.',
                'sleepPlan': 'Monitor oxygen levels regularly.',
                'consulting': 'Consult a pulmonologist.'
            },
            'Severe': {
                'diet': 'Medical nutrition therapy may be needed.',
                'sleepPlan': 'Strictly follow prescribed oxygen therapy.',
                'consulting': 'Immediate pulmonologist consultation required.'
            }
        },
        'REM Sleep Behavior Disorder': {
            'Mild': {
                'diet': 'Avoid antidepressants unless prescribed.',
                'sleepPlan': 'Make sleep environment safe.',
                'consulting': 'Consult a sleep specialist if symptoms worsen.'
            },
            'Moderate': {
                'diet': 'Consult a doctor about medication side effects.',
                'sleepPlan': 'Use bed rails or padding for safety.',
                'consulting': 'Consult a sleep specialist.'
            },
            'Severe': {
                'diet': 'Medical therapy may be needed.',
                'sleepPlan': 'Supervised care may be required.',
                'consulting': 'Immediate specialist consultation.'
            }
        }
    }
    # Default fallback
    if disorder in recommendations and severity in recommendations[disorder]:
        return recommendations[disorder][severity]
    # If disorder not found, fallback to severity-based
    if severity == 'Mild':
        return {'diet': 'Avoid caffeine after noon.', 'sleepPlan': 'Maintain 7-9 hours sleep.', 'consulting': 'Try relaxation apps.'}
    elif severity == 'Moderate':
        return {'diet': 'Include magnesium-rich foods like bananas.', 'sleepPlan': 'Establish bedtime routine.', 'consulting': 'See a nutritionist.'}
    else:
        return {'diet': 'Focus on light dinners.', 'sleepPlan': 'Limit naps.', 'consulting': 'Consult sleep specialist.'}

def evaluate_model(model, X_test, y_test):
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average='weighted')
    rec = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    cm = confusion_matrix(y_test, y_pred)
    print(f'Accuracy: {acc:.2f}')
    print(f'Precision: {prec:.2f}')
    print(f'Recall: {rec:.2f}')
    print(f'F1 Score: {f1:.2f}')
    print('Confusion Matrix:')
    print(cm)
    return {'accuracy': acc, 'precision': prec, 'recall': rec, 'f1': f1, 'confusion_matrix': cm.tolist()}

if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'analyze':
        with open('input.json', 'r') as f:
            data = json.load(f)
        result = analyze(data)
        print(json.dumps(result))
    elif mode == 'recommend':
        # Assume severity from latest analysis (mock)
        with open('input.json', 'r') as f:
            data = json.load(f)
        result = recommend('Moderate')
        print(json.dumps(result))
    elif mode == 'evaluate':
        import pandas as pd
        import os
        base_dir = os.path.dirname(__file__)
        csv_path = os.path.join(base_dir, 'test_data.csv')
        if not os.path.exists(csv_path):
            # Create a sample CSV if not present
            sample = pd.DataFrame({
                'sleepStages': [2, 3, 1, 2, 3],
                'hrv': [55, 60, 50, 65, 58],
                'blood_oxygen': [97, 98, 96, 99, 97],
                'movement': [1, 0, 2, 1, 0],
                'breathing': [15, 14, 16, 15, 14],
                'label': [0, 1, 0, 1, 1]
            })
            sample.to_csv(csv_path, index=False)
            print(f"Sample test_data.csv created. Please replace with your real test data.")
        test_df = pd.read_csv(csv_path)
        print("Class distribution in test data:")
        print(test_df['label'].value_counts())
        feature_cols = ['sleepStages', 'hrv', 'blood_oxygen', 'movement', 'breathing']
        X_test = test_df[feature_cols].values
        y_test = test_df['label'].values
        # Apply scaler if available
        if 'scaler' in globals() and scaler is not None:
            X_test_scaled = scaler.transform(X_test)
        else:
            X_test_scaled = X_test

        if xgb_model is None:
            raise Exception('XGBoost model not loaded. Train first with train.py')

        metrics = evaluate_model(xgb_model, X_test_scaled, y_test)
        print(json.dumps(metrics))
import sys
import json
import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
import xgboost as xgb
import shap
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend for Flask
import matplotlib.pyplot as plt
import base64
from io import BytesIO
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# Mock training (in reality, train on real dataset)
def train_models():
    # Mock data
    # 0: None, 1: Apnea, 2: Insomnia, 3: RLS, 4: Narcolepsy, 5: PLMD, 6: Hypoxemia, 7: REM Sleep Behavior Disorder
    X = np.random.rand(200, 5, 1)
    y = np.random.randint(0, 8, 200)

    # LSTM for feature extraction (multiclass)
    lstm = Sequential()
    lstm.add(LSTM(50, input_shape=(5, 1)))
    lstm.add(Dense(8, activation='softmax'))
    lstm.compile(optimizer='adam', loss='categorical_crossentropy')
    from tensorflow.keras.utils import to_categorical
    lstm.fit(X, to_categorical(y, num_classes=8), epochs=1)

    # XGBoost for classification (multiclass)
    features = np.random.rand(200, 5)
    xgb_model = xgb.XGBClassifier(objective='multi:softmax', num_class=8)
    xgb_model.fit(features, y)

    return lstm, xgb_model

lstm_model, xgb_model = train_models()

# SHAP explainer
explainer = shap.Explainer(xgb_model)

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
        # Prepare DataFrame for XGBoost
        df = pd.DataFrame([{
            'sleepStages': sleepStages_num[0],
            'hrv': hrv,
            'blood_oxygen': blood_oxygen,
            'movement': movement,
            'breathing': breathing
        }])
        features = df[['sleepStages', 'hrv', 'blood_oxygen', 'movement', 'breathing']].values
        # LSTM expects sleepStages as array of numbers
        timesteps = np.array(sleepStages_num).reshape(1, -1, 1)
        lstm_pred = lstm_model.predict(timesteps)
        pred = int(xgb_model.predict(features)[0])
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
        severity_idx = np.argmax(lstm_pred[0])
        severity = ['Mild', 'Moderate', 'Severe', 'Severe', 'Severe', 'Severe', 'Severe', 'Severe'][severity_idx]
        shap_values = explainer(features)
        print('DEBUG: shap_values shape:', getattr(shap_values, 'shape', None))
        print('DEBUG: shap_values.values shape:', getattr(shap_values, 'values', None).shape if hasattr(shap_values, 'values') else None)
        print('DEBUG: shap_values.base_values shape:', getattr(shap_values, 'base_values', None).shape if hasattr(shap_values, 'base_values') else None)
        plt.figure()
        # For multiclass, plot the explanation for the predicted class using SHAP Explanation object
        shap_exp = shap.Explanation(
            values=shap_values.values[0, :, pred],
            base_values=shap_values.base_values[0, pred],
            data=features[0],
            feature_names=df.columns
        )
        shap.plots.waterfall(shap_exp)
        buf = BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        shap_plot = base64.b64encode(buf.read()).decode('utf-8')
        # More detailed explanation
        severity_desc = {
            'Mild': 'Slight abnormality detected. Monitor your sleep and consider lifestyle adjustments.',
            'Moderate': 'Noticeable abnormality detected. Consider consulting a specialist and improving sleep hygiene.',
            'Severe': 'Severe abnormality detected. Strongly recommended to consult a healthcare professional.'
        }[severity]
        # Get SHAP value for SpO2 feature
        spO2_idx = list(df.columns).index('blood_oxygen')
        spO2_shap = shap_values.values[0, spO2_idx, pred]
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
        csv_path = 'test_data.csv'
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
        X_test = test_df[['sleepStages', 'hrv', 'blood_oxygen', 'movement', 'breathing']].values
        y_test = test_df['label'].values
        metrics = evaluate_model(xgb_model, X_test, y_test)
        print(json.dumps(metrics))
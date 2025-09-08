from flask import Flask, request, jsonify
import traceback
import numpy as np
import pandas as pd
import base64
from io import BytesIO
import matplotlib.pyplot as plt
from model import analyze

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    # Validate required fields
    required_fields = ['sleepStages', 'hrv', 'blood_oxygen', 'movement', 'breathing']
    missing = [f for f in required_fields if f not in data]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400
    try:
        print('Incoming data:', data, flush=True)
        result = analyze(data)
        return jsonify(result)
    except Exception as e:
        print('Exception in /predict:', str(e), flush=True)
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)

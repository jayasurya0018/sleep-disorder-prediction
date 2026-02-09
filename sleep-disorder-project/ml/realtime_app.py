"""
Real-Time ML Inference Service
Optimized for sub-second prediction latency
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback
import numpy as np
import pandas as pd
import time
from model import analyze
import threading
import queue

app = Flask(__name__)
CORS(app)

# Request queue for batch processing
inference_queue = queue.Queue(maxsize=1000)
results_dict = {}

# Performance metrics
request_count = 0
total_latency = 0.0
lock = threading.Lock()


@app.route('/predict', methods=['POST'])
def predict():
    """Standard prediction endpoint"""
    data = request.json
    required_fields = ['sleepStages', 'hrv', 'blood_oxygen', 'movement', 'breathing']
    missing = [f for f in required_fields if f not in data]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400
    
    try:
        start_time = time.time()
        print('Incoming data:', data, flush=True)
        result = analyze(data)
        
        # Add latency metrics
        latency = (time.time() - start_time) * 1000  # Convert to ms
        result['latency_ms'] = round(latency, 2)
        
        # Update global metrics
        global request_count, total_latency
        with lock:
            request_count += 1
            total_latency += latency
            result['avg_latency_ms'] = round(total_latency / request_count, 2)
        
        return jsonify(result)
    except Exception as e:
        print('Exception in /predict:', str(e), flush=True)
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/predict/realtime', methods=['POST'])
def predict_realtime():
    """
    Optimized real-time prediction endpoint
    Returns predictions with minimal latency
    """
    data = request.json
    
    # Quick validation
    if not all(k in data for k in ['hrv', 'blood_oxygen', 'movement', 'breathing']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        start_time = time.time()
        
        # Use simplified feature set for faster inference
        result = analyze_fast(data)
        
        latency = (time.time() - start_time) * 1000
        result['latency_ms'] = round(latency, 2)
        result['realtime'] = True
        
        return jsonify(result)
        
    except Exception as e:
        print('Real-time prediction error:', str(e), flush=True)
        return jsonify({'error': str(e), 'fallback': True}), 500


@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """
    Batch prediction for multiple data points
    More efficient than multiple single predictions
    """
    data_array = request.json.get('data', [])
    
    if not isinstance(data_array, list):
        return jsonify({'error': 'Expected array of data points'}), 400
    
    try:
        start_time = time.time()
        results = []
        
        for item in data_array:
            try:
                result = analyze(item)
                results.append({
                    'success': True,
                    'data': result
                })
            except Exception as e:
                results.append({
                    'success': False,
                    'error': str(e)
                })
        
        latency = (time.time() - start_time) * 1000
        
        return jsonify({
            'results': results,
            'count': len(results),
            'total_latency_ms': round(latency, 2),
            'avg_latency_per_item_ms': round(latency / max(len(results), 1), 2)
        })
        
    except Exception as e:
        print('Batch prediction error:', str(e), flush=True)
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ml-inference',
        'requests_processed': request_count,
        'avg_latency_ms': round(total_latency / max(request_count, 1), 2) if request_count > 0 else 0
    })


@app.route('/metrics', methods=['GET'])
def metrics():
    """Performance metrics endpoint"""
    return jsonify({
        'total_requests': request_count,
        'total_latency_ms': round(total_latency, 2),
        'avg_latency_ms': round(total_latency / max(request_count, 1), 2) if request_count > 0 else 0,
        'queue_size': inference_queue.qsize()
    })


def analyze_fast(data):
    """
    Simplified analysis for real-time inference
    Uses fewer features and faster algorithms
    """
    # Extract values
    hrv = float(data.get('hrv', 50))
    spo2 = float(data.get('blood_oxygen', 95))
    movement = float(data.get('movement', 0))
    breathing = float(data.get('breathing', 15))
    
    # Quick rule-based classification
    issues = []
    severity = 'Normal'
    
    # SpO2 check
    if spo2 < 90:
        issues.append('Critical oxygen desaturation')
        severity = 'Severe'
    elif spo2 < 94:
        issues.append('Low blood oxygen')
        severity = 'Moderate'
    
    # HRV check
    if hrv < 20:
        issues.append('Very low HRV')
        if severity == 'Normal':
            severity = 'Moderate'
    elif hrv < 40:
        issues.append('Low HRV')
        if severity == 'Normal':
            severity = 'Mild'
    
    # Breathing check
    if breathing < 8 or breathing > 20:
        issues.append('Abnormal breathing rate')
        if severity == 'Normal':
            severity = 'Moderate'
    
    # Movement check
    if movement > 10:
        issues.append('Excessive movement')
        if severity == 'Normal':
            severity = 'Mild'
    
    # Generate quick recommendation
    recommendations = []
    if spo2 < 94:
        recommendations.append('Monitor oxygen levels closely')
    if hrv < 40:
        recommendations.append('Practice relaxation techniques')
    if breathing < 8 or breathing > 20:
        recommendations.append('Consider sleep apnea evaluation')
    
    return {
        'disorder': 'Sleep Disorder Detected' if issues else 'Normal Sleep',
        'severity': severity,
        'confidence': 0.75,
        'issues': issues,
        'recommendations': recommendations,
        'metrics': {
            'hrv': hrv,
            'spo2': spo2,
            'movement': movement,
            'breathing': breathing
        },
        'fast_inference': True
    }


if __name__ == '__main__':
    print('Starting Real-Time ML Inference Service...')
    print('Optimized for low-latency predictions')
    app.run(host='0.0.0.0', port=5002, threaded=True)

# ML training

This folder contains simple training utilities for the sleep disorder ML models.

Files:
- `model.py` - model logic, loads saved models (`xgb_model.pkl`, `lstm_model.h5`) if present and exposes `analyze()` and `recommend()`.
- `train.py` - CLI to train models from a CSV file and save artifacts.
- `data.csv` - example training data (you can replace with your dataset).

Quick start:

1. Create a Python virtual environment and install dependencies from `requirements.txt`.
2. Place your training CSV in this folder. The CSV must contain columns: `sleepStages` (or `sleep_stages`), `hrv`, `blood_oxygen`, `movement`, `breathing`, `label`.
3. Run training:

```bash
python train.py --csv data.csv --epochs 5
```

This will save `xgb_model.pkl` and `lstm_model.h5` in this folder.

After training, the Flask app (`app.py`) will automatically use the saved models when running predictions.

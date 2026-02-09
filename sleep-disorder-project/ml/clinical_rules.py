"""Clinical rule engine for sleep disorder detection.

Implements threshold-based heuristics derived from physiological references
to provide an interpretable secondary opinion alongside ML predictions.

Inputs (metrics dict):
  - hrv: float (ms)
  - movement: float (per hour)
  - blood_oxygen: float (percent SpO2)
  - breathing: float (breaths per minute)
  - awake_percentage, light_percentage, deep_percentage, rem_percentage: floats (0-100)

Outputs:
  - list of dicts with keys: disorder, score (0..1), severity in {'Mild','Moderate','Severe'}, reasons (list)
"""
from __future__ import annotations
from typing import Dict, List


def _pct(val: float) -> float:
    try:
        return float(val)
    except Exception:
        return 0.0


def _in_range(x: float, lo: float, hi: float) -> bool:
    return x is not None and lo <= x <= hi


def _score_range(x: float, lo: float, hi: float) -> float:
    """Return 1.0 if inside [lo,hi], else a decaying score based on distance."""
    try:
        x = float(x)
    except Exception:
        return 0.0
    if lo <= x <= hi:
        return 1.0
    # linear decay up to 50% outside the band
    if x < lo:
        return max(0.0, 1.0 - (lo - x) / max(1.0, lo * 0.5))
    else:
        return max(0.0, 1.0 - (x - hi) / max(1.0, hi * 0.5))


def _dominant_stage(metrics: Dict[str, float]) -> str:
    stages = {
        'Awake': _pct(metrics.get('awake_percentage', 0)),
        'Light': _pct(metrics.get('light_percentage', 0)),
        'Deep': _pct(metrics.get('deep_percentage', 0)),
        'REM': _pct(metrics.get('rem_percentage', 0)),
    }
    return max(stages, key=stages.get)


def _severity_from_oxygen_breathing(m: Dict[str, float]) -> str:
    spo2 = m.get('blood_oxygen', 100)
    br = m.get('breathing', 15)
    sev = 0
    if spo2 < 85:
        sev += 2
    elif spo2 < 90:
        sev += 1
    if br < 8 or br > 30:
        sev += 2
    elif br < 10 or br > 25:
        sev += 1
    if sev >= 3:
        return 'Severe'
    if sev == 2:
        return 'Moderate'
    return 'Mild'


def evaluate_rules(metrics: Dict[str, float]) -> List[Dict[str, object]]:
    hrv = metrics.get('hrv', 0)
    move = metrics.get('movement', 0)
    spo2 = metrics.get('blood_oxygen', 100)
    br = metrics.get('breathing', 15)
    awake = _pct(metrics.get('awake_percentage', 0))
    light = _pct(metrics.get('light_percentage', 0))
    deep = _pct(metrics.get('deep_percentage', 0))
    rem = _pct(metrics.get('rem_percentage', 0))
    dom = _dominant_stage(metrics)

    out: List[Dict[str, object]] = []

    # Normal Sleep
    score = (
        0.25 * _score_range(hrv, 50, 70) +
        0.25 * _score_range(move, 0, 10) +
        0.25 * _score_range(spo2, 95, 100) +
        0.25 * _score_range(br, 12, 18)
    )
    # Balanced Deep & REM ~ each >= 20%
    if deep >= 20 and rem >= 20:
        score = min(1.0, score + 0.1)
    out.append({'disorder': 'None', 'score': float(score), 'severity': 'Mild', 'reasons': ['Within normal ranges']})

    # Insomnia
    score = 0.0
    score += 0.3 if (move >= 20) else 0.0
    score += 0.3 if (awake >= 25 or light >= 40) else 0.0
    score += 0.2 * _score_range(hrv, 30, 55)
    score += 0.2 * _score_range(br, 14, 20)
    sev = 'Severe' if (awake > 40 and move > 35) else 'Moderate' if (awake > 30 and move > 25) else 'Mild'
    out.append({'disorder': 'Insomnia', 'score': float(min(score, 1.0)), 'severity': sev, 'reasons': ['High awakenings/light sleep', 'Elevated movement']})

    # OSA
    score = 0.0
    score += 0.4 if spo2 < 90 else 0.0
    score += 0.2 if (8 <= br <= 25) else 0.0
    score += 0.2 if move >= 20 else 0.0
    score += 0.2 if (dom in ['Light', 'Awake']) else 0.0
    out.append({'disorder': 'Apnea', 'score': float(min(score, 1.0)), 'severity': _severity_from_oxygen_breathing(metrics), 'reasons': ['SpO2 dips/irregular breathing']})

    # CSA
    score = 0.0
    score += 0.5 if spo2 < 88 else 0.0
    score += 0.3 if br < 10 else 0.0
    score += 0.2 * _score_range(hrv, 15, 35)
    out.append({'disorder': 'Central Sleep Apnea', 'score': float(min(score, 1.0)), 'severity': _severity_from_oxygen_breathing(metrics), 'reasons': ['Low breathing rate', 'Low SpO2']})

    # Complex Sleep Apnea
    score = 0.0
    score += 0.5 if spo2 < 85 else 0.0
    score += 0.3 if (br < 8 or br > 25) else 0.0
    score += 0.2 if move >= 25 else 0.0
    out.append({'disorder': 'Complex Sleep Apnea', 'score': float(min(score, 1.0)), 'severity': _severity_from_oxygen_breathing(metrics), 'reasons': ['Very low SpO2', 'Breathing instability']})

    # Narcolepsy
    score = 0.0
    score += 0.3 * _score_range(hrv, 40, 60)
    score += 0.3 if (5 <= move <= 20) else 0.0
    score += 0.2 * _score_range(spo2, 94, 98)
    score += 0.2 * _score_range(br, 12, 18)
    score += 0.1 if rem >= 25 else 0.0
    out.append({'disorder': 'Narcolepsy', 'score': float(min(score, 1.0)), 'severity': 'Moderate', 'reasons': ['REM prominence', 'EDS indicators']})

    # RLS
    score = 0.0
    score += 0.4 if move >= 40 else 0.0
    score += 0.3 * _score_range(hrv, 35, 55)
    score += 0.2 if light >= 40 else 0.0
    out.append({'disorder': 'Restless Legs Syndrome', 'score': float(min(score, 1.0)), 'severity': 'Moderate' if move > 50 else 'Mild', 'reasons': ['High limb activity']})

    # PLMD
    score = 0.0
    score += 0.5 if move >= 40 else 0.0
    score += 0.2 * _score_range(hrv, 30, 50)
    score += 0.2 * _score_range(spo2, 94, 99)
    out.append({'disorder': 'Periodic Limb Movement Disorder', 'score': float(min(score, 1.0)), 'severity': 'Moderate' if move > 60 else 'Mild', 'reasons': ['Periodic jerks suspected']})

    # RBD
    score = 0.0
    score += 0.4 if (30 <= move <= 60) else 0.0
    score += 0.2 if rem >= 25 else 0.0
    score += 0.2 * _score_range(hrv, 40, 60)
    score += 0.2 * _score_range(spo2, 94, 98)
    out.append({'disorder': 'REM Sleep Behavior Disorder', 'score': float(min(score, 1.0)), 'severity': 'Moderate', 'reasons': ['Movement during REM']})

    # Hypoventilation
    score = 0.0
    score += 0.5 if (80 <= spo2 <= 90) else 0.0
    score += 0.4 if br < 10 else 0.0
    out.append({'disorder': 'Hypoventilation', 'score': float(min(score, 1.0)), 'severity': _severity_from_oxygen_breathing(metrics), 'reasons': ['Shallow/slow breathing']})

    # Circadian Rhythm Disorder (heuristic)
    score = 0.0
    score += 0.3 * _score_range(hrv, 40, 65)
    score += 0.2 * _score_range(move, 10, 25)
    # Hard to infer without timestamps; keep as low-confidence cue
    out.append({'disorder': 'Circadian Rhythm Disorder', 'score': float(min(score, 0.6)), 'severity': 'Mild', 'reasons': ['Pattern misalignment suspected']})

    # Parasomnia
    score = 0.0
    score += 0.4 if (move >= 30 and deep >= 30) else 0.0
    score += 0.2 * _score_range(hrv, 45, 65)
    out.append({'disorder': 'Parasomnia', 'score': float(min(score, 1.0)), 'severity': 'Moderate' if move > 50 else 'Mild', 'reasons': ['Abnormal events during deep sleep suspected']})

    # Bruxism
    score = 0.0
    score += 0.4 if (30 <= move <= 50 and light >= 40) else 0.0
    score += 0.2 * _score_range(hrv, 40, 60)
    out.append({'disorder': 'Bruxism', 'score': float(min(score, 1.0)), 'severity': 'Mild', 'reasons': ['Jaw activity indicators']})

    # Hypersomnia
    score = 0.0
    score += 0.3 * _score_range(hrv, 50, 70)
    score += 0.3 if (5 <= move <= 15) else 0.0
    if deep >= 30 or rem >= 30:
        score += 0.2
    out.append({'disorder': 'Hypersomnia', 'score': float(min(score, 1.0)), 'severity': 'Moderate' if (deep >= 35 or rem >= 35) else 'Mild', 'reasons': ['Prolonged sleep tendency']})

    # Sort by score descending
    out.sort(key=lambda x: x['score'], reverse=True)
    return out

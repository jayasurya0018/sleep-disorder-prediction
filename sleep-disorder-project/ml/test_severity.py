import json
from model import analyze

cases = {
    "normal": {
        "sleepStages": "Deep,REM,Light,Deep,REM,Light,Awake",
        "hrv": 60,
        "blood_oxygen": 98,
        "movement": 5,
        "breathing": 15
    },
    "apnea": {
        "sleepStages": "Light,Awake,Light,Awake",
        "hrv": 35,
        "blood_oxygen": 85,
        "movement": 30,
        "breathing": 28
    },
    "insomnia": {
        "sleepStages": "Awake,Light,Awake,Light,Awake,Light",
        "hrv": 50,
        "blood_oxygen": 97,
        "movement": 35,
        "breathing": 16
    }
}

for name, data in cases.items():
    try:
        res = analyze(data)
        print(f"\n== {name.upper()} ==")
        print(json.dumps({
            "disorder": res.get("disorder"),
            "severity": res.get("severity"),
            "confidence": res.get("confidence"),
            "top_rule": res.get("clinical_rules", [{}])[0]
        }, indent=2))
    except Exception as e:
        print(f"Case {name} failed: {e}")

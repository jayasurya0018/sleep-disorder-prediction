#!/usr/bin/env python3
import sys
import json
import traceback

from model import analyze

def main():
    # Read JSON input from stdin
    raw = sys.stdin.read()
    try:
        data = json.loads(raw)
    except Exception:
        print(json.dumps({"error": "Invalid JSON input"}))
        sys.exit(1)

    try:
        res = analyze(data)
        print(json.dumps(res))
    except Exception as e:
        traceback.print_exc()
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()

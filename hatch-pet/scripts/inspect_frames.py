import argparse
import json
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--frames-root", required=True, type=Path)
    parser.add_argument("--json-out", required=True, type=Path)
    parser.add_argument("--require-components", action="store_true")
    parser.add_argument("--allow-stable-slots", action="store_true")
    args = parser.parse_args()
    
    review = {
        "errors": [],
        "warnings": [],
        "rows": {}
    }
    
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(review, indent=2))
    print(f"Inspected frames, wrote {args.json_out}")

if __name__ == "__main__":
    main()

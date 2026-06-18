import argparse
import json
from pathlib import Path
from PIL import Image

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("spritesheet", type=Path)
    parser.add_argument("--json-out", required=True, type=Path)
    args = parser.parse_args()
    
    validation = {"valid": True, "errors": []}
    
    if not args.spritesheet.exists():
        validation["valid"] = False
        validation["errors"].append("Spritesheet not found")
    else:
        img = Image.open(args.spritesheet)
        if img.size != (1536, 1872):
            validation["valid"] = False
            validation["errors"].append(f"Invalid size: {img.size}. Expected 1536x1872")
            
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(validation, indent=2))
    print(f"Validated atlas, wrote {args.json_out}")

if __name__ == "__main__":
    main()

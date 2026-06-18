import argparse
import json
from pathlib import Path
from PIL import Image

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--decoded-dir", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--states", default="all")
    parser.add_argument("--method", default="auto")
    args = parser.parse_args()
    
    args.output_dir.mkdir(parents=True, exist_ok=True)
    manifest = []
    
    states = ["idle", "running-right", "running-left", "waving", "jumping", "failed", "waiting", "running", "review"]
    
    for row_idx, state in enumerate(states):
        strip_path = args.decoded_dir / f"{state}.png"
        if not strip_path.exists():
            continue
            
        img = Image.open(strip_path)
        w, h = img.size
        frames = w // 192
        
        for col_idx in range(frames):
            box = (col_idx*192, 0, (col_idx+1)*192, h)
            frame = img.crop(box)
            
            frame_name = f"{state}_{col_idx:02d}.png"
            frame.save(args.output_dir / frame_name)
            
            manifest.append({
                "state": state,
                "row": row_idx,
                "col": col_idx,
                "file": frame_name
            })
            
    (args.output_dir / "frames-manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"Extracted frames to {args.output_dir}")

if __name__ == "__main__":
    main()

import argparse
import json
from pathlib import Path
from PIL import Image

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--frames-root", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--webp-output", required=True, type=Path)
    args = parser.parse_args()
    
    atlas = Image.new("RGBA", (1536, 1872), (0,0,0,0))
    manifest_path = args.frames_root / "frames-manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text())
        for item in manifest:
            frame_path = args.frames_root / item["file"]
            if frame_path.exists():
                img = Image.open(frame_path)
                atlas.paste(img, (item["col"] * 192, item["row"] * 208))
                
    args.output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(args.output)
    atlas.save(args.webp_output, format="WEBP", lossless=True)
    print(f"Composed atlas to {args.webp_output}")

if __name__ == "__main__":
    main()

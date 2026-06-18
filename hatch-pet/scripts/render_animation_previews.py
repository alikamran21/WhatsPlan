import argparse
from pathlib import Path
from PIL import Image
import os

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--frames-root", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args()
    
    args.output_dir.mkdir(parents=True, exist_ok=True)
    states = ["idle", "running-right", "running-left", "waving", "jumping", "failed", "waiting", "running", "review"]
    
    for state in states:
        frames = []
        for i in range(8):
            frame_path = args.frames_root / f"{state}_{i:02d}.png"
            if frame_path.exists():
                frames.append(Image.open(frame_path).convert("RGBA"))
                
        if frames:
            # Save as GIF
            out_path = args.output_dir / f"{state}.gif"
            
            # Convert to RGB with white background for GIF if transparent
            gif_frames = []
            for f in frames:
                bg = Image.new("RGBA", f.size, (255, 255, 255, 255))
                bg.paste(f, (0, 0), f)
                gif_frames.append(bg.convert("RGB"))
                
            gif_frames[0].save(
                out_path,
                save_all=True,
                append_images=gif_frames[1:],
                duration=100,
                loop=0
            )
            print(f"Rendered {out_path}")

if __name__ == "__main__":
    main()

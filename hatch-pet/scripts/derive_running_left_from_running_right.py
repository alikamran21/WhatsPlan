import argparse
from pathlib import Path
from PIL import Image

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-dir", required=True, type=Path)
    parser.add_argument("--confirm-appropriate-mirror", action="store_true")
    parser.add_argument("--decision-note")
    args = parser.parse_args()
    
    right_path = args.run_dir / "decoded" / "running-right.png"
    left_path = args.run_dir / "decoded" / "running-left.png"
    
    if not right_path.exists():
        print(f"Error: {right_path} not found.")
        return
        
    print(f"Deriving running-left from {right_path}")
    img = Image.open(right_path)
    
    # Mirror each 192x208 frame in place
    w, h = img.size
    frames = w // 192
    
    out_img = Image.new("RGBA", (w, h), (0,0,0,0))
    for i in range(frames):
        box = (i*192, 0, (i+1)*192, h)
        frame = img.crop(box)
        frame = frame.transpose(Image.FLIP_LEFT_RIGHT)
        out_img.paste(frame, box)
        
    left_path.parent.mkdir(exist_ok=True, parents=True)
    out_img.save(left_path)
    print(f"Saved {left_path}")

if __name__ == "__main__":
    main()

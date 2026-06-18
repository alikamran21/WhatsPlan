import argparse
from pathlib import Path
from PIL import Image

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("spritesheet", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    
    if args.spritesheet.exists():
        img = Image.open(args.spritesheet)
        # For the contact sheet, just add a dark background so transparent pixels are visible
        bg = Image.new("RGBA", img.size, (40, 40, 40, 255))
        bg.paste(img, (0, 0), img)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        bg.save(args.output)
        print(f"Created contact sheet at {args.output}")

if __name__ == "__main__":
    main()

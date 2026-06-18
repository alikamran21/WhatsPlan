import argparse
import json
import os
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Prepare a pet run folder and imagegen job manifest")
    parser.add_argument("--pet-name", required=True)
    parser.add_argument("--description", default="A Codex pet.")
    parser.add_argument("--reference")
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--pet-notes", default="")
    parser.add_argument("--brand-discovery-file")
    parser.add_argument("--brand-name")
    parser.add_argument("--brand-brief")
    parser.add_argument("--brand-source", action="append")
    parser.add_argument("--style-preset", default="auto")
    parser.add_argument("--style-notes", default="")
    parser.add_argument("--force", action="store_true")
    
    args = parser.parse_args()
    
    out_dir = args.output_dir
    if out_dir.exists() and not args.force:
        print("Output directory already exists. Use --force.")
        return
        
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "prompts").mkdir(exist_ok=True)
    (out_dir / "decoded").mkdir(exist_ok=True)
    (out_dir / "references" / "layout-guides").mkdir(parents=True, exist_ok=True)
    
    # Generate pet_request.json
    pet_request = {
        "pet_id": args.pet_name.lower().replace(" ", "_"),
        "display_name": args.pet_name,
        "description": args.description,
        "chroma_key": "#00FF00"
    }
    (out_dir / "pet_request.json").write_text(json.dumps(pet_request, indent=2))
    
    # Generate imagegen-jobs.json
    jobs = []
    states = ["idle", "running-right", "running-left", "waving", "jumping", "failed", "waiting", "running", "review"]
    
    jobs.append({
        "id": "base",
        "kind": "base",
        "status": "pending",
        "depends_on": [],
        "prompt_file": "prompts/base-pet.md",
        "output_path": "decoded/base.png"
    })
    
    for state in states:
        jobs.append({
            "id": state,
            "kind": "row",
            "status": "pending",
            "depends_on": ["base"],
            "prompt_file": f"prompts/{state}.md",
            "retry_prompt_file": f"prompts/{state}-retry.md",
            "input_images": [
                {"path": f"references/layout-guides/{state}.png", "role": "layout-guide"},
                {"path": "references/canonical-base.png", "role": "canonical-base"}
            ],
            "output_path": f"decoded/{state}.png"
        })
        
    (out_dir / "imagegen-jobs.json").write_text(json.dumps({"jobs": jobs}, indent=2))
    
    print(f"Prepared run in {out_dir}")

if __name__ == "__main__":
    main()

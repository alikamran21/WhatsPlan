# Hatchling sprite assets

The in-app pet (`SpritePet` in `src/components/WhatsPlanApp.tsx`) loads its
animation from this folder at runtime:

- **`atlas.json`** — frame layout (already here): 1536×1872 atlas, 192×208
  frames, 8 cols × 9 rows, 10 fps, one animation state per row.
- **`atlas.webp`** — the sprite sheet itself. **Drop it here.** Until it exists,
  the app shows a drawn placeholder hatchling (so nothing breaks).

The moment `atlas.webp` is present at this path, the app uses it automatically —
no code changes.

## Generating `atlas.webp`

Use the pipeline in `/hatch-pet/scripts` (Python + Pillow + an image model):

```bash
# 1. scaffold a run + imagegen job manifest
python hatch-pet/scripts/prepare_pet_run.py --pet-name "Hatchling" \
  --output-dir hatch-pet/run

# 2. (generate the per-state PNG frames via your image model into the run's
#     decoded/ folder, following imagegen-jobs.json)

# 3. compose the atlas
python hatch-pet/scripts/compose_atlas.py \
  --frames-root hatch-pet/run/frames \
  --output hatch-pet/run/atlas.png \
  --webp-output public/pets/hatchling/atlas.webp

# 4. validate (must be 1536×1872)
python hatch-pet/scripts/validate_atlas.py public/pets/hatchling/atlas.webp \
  --json-out hatch-pet/run/validation.json
```

The atlas must be **1536×1872** with frames laid out exactly as `atlas.json`
describes, or the rows/states won't line up.

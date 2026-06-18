# Creating a pet with Codex

The app's floating companion (`SpritePet` in `src/components/WhatsPlanApp.tsx`)
can render **two kinds** of pet art. Pick whichever fits:

1. **A single still image** (easiest) — e.g. your fox. Save it to
   `public/pets/fox.png` and it shows immediately (the app already looks there).
2. **An animated sprite sheet** (a 1536×1872 "atlas") — multiple poses
   (idle / waving / jumping / running…) that the app plays at ~10 fps.

This guide is about generating option 2 with Codex + the pipeline already in
this repo under `hatch-pet/scripts`.

## The flow

```
Codex prompt ──▶ per-pose PNG frames ──▶ compose_atlas.py ──▶ atlas.webp ──▶ public/pets/<pet>/
```

### 1. Scaffold a run

```bash
python hatch-pet/scripts/prepare_pet_run.py \
  --pet-name "Foxy" \
  --description "A cute chibi orange fox, pixel-art, kawaii, big sparkly eyes" \
  --output-dir hatch-pet/runs/foxy
```

This writes `pet_request.json` and `imagegen-jobs.json` listing the poses to
generate: **idle, running-right, running-left, waving, jumping, failed,
waiting, running, review** (one row each in the final atlas).

### 2. Generate the frames with Codex

For each pose, ask Codex (or any image model) to produce a horizontal strip of
**8 frames** of that animation, on a **transparent background**, consistent
character, 192×208 px per frame. A good per-pose prompt:

> "Pixel-art sprite sheet, single row of 8 animation frames, a cute chibi
> orange fox **[POSE: waving]**, kawaii style, big sparkly eyes, white chest,
> fluffy tail, **transparent background**, consistent character and palette
> across all 8 frames, 192×208 px per frame, game-quality, crisp pixels."

Save each pose's frames as `idle_00.png … idle_07.png`, `waving_00.png …`,
etc. into a `frames/` folder (the scripts `extract_strip_frames.py` and
`derive_running_left_from_running_right.py` help slice strips and mirror the
run-left row from run-right).

Tips for consistency (the hard part of AI sprites):
- Generate the **idle** pose first, then feed that frame back as a reference
  for every other pose so the character stays on-model.
- Keep the same palette, outline thickness, and canvas size every time.
- Transparent background is essential — otherwise the pet shows in a box.

### 3. Compose + validate the atlas

```bash
python hatch-pet/scripts/compose_atlas.py \
  --frames-root hatch-pet/runs/foxy/frames \
  --output hatch-pet/runs/foxy/atlas.png \
  --webp-output public/pets/foxy/atlas.webp

python hatch-pet/scripts/validate_atlas.py public/pets/foxy/atlas.webp \
  --json-out hatch-pet/runs/foxy/validation.json   # must be 1536×1872
```

### 4. Point the app at it

In `SpritePet`, set the manifest src to your atlas, or just drop it at the path
the app already checks. The included `public/pets/hatchling/atlas.json`
describes the layout (192×208 frames, 8×9 grid, 10 fps, one state per row) —
copy it next to your `atlas.webp` and the app animates it automatically.

## Shortcut (no pipeline)

Don't need animation? **Skip all of the above** — just export your pet as a
transparent PNG and save it to `public/pets/fox.png`. That's exactly what we
did with your fox; the app renders it as the companion with a gentle float and
jump-on-celebrate, no frames required.

# Midnight Duo — GTA 6-style cover maker

An offline browser web app that turns your photos into a neon-night GTA 6-style
cover: one hero photo plus four scene panels, lettered in the genre's style,
exported as a PNG to share. Built for the make.fun competition
`gta6-cover-art-01` ("Make GTA 6 Cover Art").

## What it does

- **Band layout (default):** hero photo on the left (wide) or on top
  (portrait / story / square) with a 2×2 panel stack beside or below it —
  all five photos distinct, ink gutters, no repeated panel.
- **Six grades:** `photo` (default — photos untouched), `poster`, `sunset`,
  `neon`, `golden`, `dusk`, `mono`. Grain is fixed-seed, so a grade renders
  the same way every time.
- **Lettering:** one-line title "MIDNIGHT DUO" in Passion One with a sunset
  gradient and a heavy ink outline, city "AZURA BAY" in Anton with drawn
  five-point stars, tagline "TWO LEADS · ONE SCORE", and a magenta corner
  sash reading "ONE NIGHT ONLY". No badges, no starbursts.
- **Editor:** drag to pan and scroll to zoom each panel, per-panel captions
  (off by default), undo/redo, four export sizes (1080×1080, 1080×1350,
  1920×1080, 1080×1920), PNG export, five sample photos preloaded.
- **Fully offline:** every photo, font (Anton, Pacifico, Passion One — SIL
  OFL) and line of code ships in `app/`; nothing is uploaded anywhere.

## Run it

```sh
node serve.ts            # serves app/ on http://localhost:8080
```

## Hand it in (the entry program)

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and
writes `dossier.json` with the vendored make.fun library.

## Screenshots

`shots.json` lists the four fixed scenes; `screenshots/` holds the rendered
frames (cover, editor, portrait cover, story cover), each a JPEG under the
256 KiB gate.

## License

MIT — see `LICENSE`. Fonts are under the SIL Open Font License 1.1
(`app/fonts/OFL.txt`).

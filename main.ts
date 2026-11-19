// Midnight Duo — the hand-in program for the make.fun gta6-cover-art-01 entry.
// Node 22, standard library only. It gathers the cover-maker app (app/) and its
// four screenshots (screenshots/) from beside this file, places them in the
// output directory, and writes the dossier.json the house judge reads, using the
// vendored make.fun library. The app itself never leaves the machine: it runs
// offline in a desktop browser and keeps every photo local.
//
// Local run (outside the grader's container, where /output is replaced):
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn() {
  mkdirSync(outDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
  const shotsOut = join(outDir, 'screenshots');
  mkdirSync(shotsOut, { recursive: true });
  const shotsIn = join(repoRoot, 'screenshots');
  if (existsSync(shotsIn)) cpSync(shotsIn, shotsOut, { recursive: true });
  // Gate caps from the scorer's reference/gate.json: the dossier text cap shapes
  // bytes; the other caps refuse an entry the scorer would refuse outright — at
  // most 4 screenshots, none over 256 KiB; at most 993 files under app/ totalling
  // at most 48 MiB; no app/ path longer than 1000 bytes.
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`Midnight Duo handed in: app/ + screenshots/ + dossier.json (${dossier.length} bytes) in ${outDir}`);
}

handIn();

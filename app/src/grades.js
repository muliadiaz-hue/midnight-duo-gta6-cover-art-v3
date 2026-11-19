// Photo grades — deterministic per-pixel treatments. Every grade is a pure
// function of the source pixels: the grain comes from a fixed-seed generator,
// never from Math.random or the clock, so a grade renders identically on
// every run and every machine.

// mulberry32: a tiny seeded PRNG with a stable stream for one seed.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GRAIN_SEED = 20261119;
const cache = new Map();

function clamp(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

// Applies one grade to `img` at `w`×`h` and returns a canvas holding it.
// `photo` returns the image untouched (drawn, not re-encoded).
export function treat(img, grade, w, h) {
  const key = `${grade}|${w}x${h}|${img.currentSrc || img.src}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  if (grade && grade !== 'photo') {
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    const rand = mulberry32(GRAIN_SEED);
    for (let i = 0; i < px.length; i += 4) {
      const x = (i / 4) % w;
      const y = Math.floor(i / 4 / w);
      let r = px[i];
      let g = px[i + 1];
      let b = px[i + 2];
      if (grade === 'mono') {
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = g = b = clamp((luma - 128) * 1.12 + 128);
      } else {
        // Saturation lift, then the grade's own colour shift.
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const sat = grade === 'neon' ? 1.6 : grade === 'poster' ? 1.35 : grade === 'golden' ? 1.3 : grade === 'sunset' ? 1.25 : grade === 'dusk' ? 1.1 : 1;
        r = clamp(luma + (r - luma) * sat);
        g = clamp(luma + (g - luma) * sat);
        b = clamp(luma + (b - luma) * sat);
        if (grade === 'poster' || grade === 'neon') {
          const c = grade === 'poster' ? 1.18 : 1.12;
          r = clamp((r - 128) * c + 128);
          g = clamp((g - 128) * c + 128);
          b = clamp((b - 128) * c + 128);
        }
        if (grade === 'poster') {
          const step = 255 / 4;
          r = Math.round(r / step) * step;
          g = Math.round(g / step) * step;
          b = Math.round(b / step) * step;
        }
        if (grade === 'sunset') { r = clamp(r + 18); b = clamp(b - 14); }
        if (grade === 'golden') { r = clamp(r + 22); g = clamp(g + 8); b = clamp(b - 18); }
        if (grade === 'neon') { r = clamp(r + 10); b = clamp(b + 12); }
        if (grade === 'dusk') { r = clamp(r * 0.92 - 8); g = clamp(g * 0.92); b = clamp(b * 0.92 + 16); }
        if (grade === 'poster') {
          // Fixed-seed grain, then a gentle vignette.
          const grain = (rand() - 0.5) * 14;
          r = clamp(r + grain);
          g = clamp(g + grain);
          b = clamp(b + grain);
          const nx = (x / w - 0.5) * 2;
          const ny = (y / h - 0.5) * 2;
          const vig = 1 - 0.28 * (nx * nx + ny * ny) * 0.5;
          r = clamp(r * vig);
          g = clamp(g * vig);
          b = clamp(b * vig);
        }
      }
      px[i] = r;
      px[i + 1] = g;
      px[i + 2] = b;
    }
    ctx.putImageData(data, 0, 0);
  }
  cache.set(key, out);
  return out;
}

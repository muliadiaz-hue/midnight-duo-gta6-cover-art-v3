// Midnight Duo cover renderer — draws one cover onto a canvas.
// Pure canvas 2D, no network, no Date, no Math.random: the same inputs always
// paint the same pixels. Fonts are loaded by main.js before this runs.
import { panelRects } from './layouts.js';
import { treat } from './grades.js';

export const SIZES = {
  wide: [1920, 1080],
  square: [1080, 1080],
  portrait: [1080, 1350],
  story: [1080, 1920],
};

const INK = '#160a26';
const CITY_PINK = '#ffd7e8';
const TAG_YELLOW = '#ffe054';
const SASH_MAGENTA = '#e0218a';

// Fits `text` to at most `maxWidth` by shrinking from `startSize`.
function fitFont(ctx, family, weight, text, startSize, maxWidth) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function star(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

// Draws `img` to cover `rect`, keeping the focal point (fx, fy in 0..1 of the
// image) on the rect's centre whenever the crop allows it. `view` adds the
// editor's pan (dx, dy in px) and extra zoom on top.
function drawFitted(ctx, img, rect, fx, fy, zoom, view) {
  // Works for images (naturalWidth) and for the offscreen canvases grades.js
  // returns (width).
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const extra = view ? view.zoom || 1 : 1;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom * extra;
  const dw = iw * scale;
  const dh = ih * scale;
  let ox = rect.x + rect.w / 2 - fx * dw;
  let oy = rect.y + rect.h / 2 - fy * dh;
  ox = Math.min(rect.x, Math.max(rect.x + rect.w - dw, ox));
  oy = Math.min(rect.y, Math.max(rect.y + rect.h - dh, oy));
  if (view) {
    ox += view.dx || 0;
    oy += view.dy || 0;
    ox = Math.min(rect.x, Math.max(rect.x + rect.w - dw, ox));
    oy = Math.min(rect.y, Math.max(rect.y + rect.h - dh, oy));
  }
  ctx.drawImage(img, ox, oy, dw, dh);
}

function drawPanel(ctx, img, rect, grade, focal, zoom, view, tilt) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (tilt) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((tilt * Math.PI) / 180);
    ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
  }
  const graded = treat(img, grade, Math.max(2, Math.round(rect.w)), Math.max(2, Math.round(rect.h)));
  const fx = focal ? focal.x : 0.5;
  const fy = focal ? focal.y : 0.5;
  drawFitted(ctx, graded, rect, fx, fy, zoom, view);
  ctx.restore();
}

// The title block: city line with drawn stars, the one-line gradient title,
// and the tagline — all centred on `zone` (a rect) and stacked from `top`
// (the scrim's top edge) to the zone's bottom.
function drawTitleBlock(ctx, zone, caption, city, subtitle) {
  const cx = zone.x + zone.w / 2;
  const scrimTop = zone.y + zone.h * 0.70;
  const scrim = ctx.createLinearGradient(0, scrimTop, 0, zone.y + zone.h);
  scrim.addColorStop(0, 'rgba(16, 4, 32, 0)');
  scrim.addColorStop(1, 'rgba(16, 4, 32, 0.94)');
  ctx.fillStyle = scrim;
  ctx.fillRect(zone.x, scrimTop, zone.w, zone.y + zone.h - scrimTop);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const citySize = Math.max(12, zone.h * 0.032);
  ctx.font = `${citySize}px Anton, sans-serif`;
  try { ctx.letterSpacing = `${Math.round(zone.w * 0.018)}px`; } catch { /* older canvas */ }
  const cityText = (city || '').trim().toUpperCase();
  const cityY = zone.y + zone.h * 0.815;
  const cityW = ctx.measureText(cityText).width;
  const starR = citySize * 0.42;
  ctx.fillStyle = CITY_PINK;
  if (cityText) {
    ctx.fillText(cityText, cx, cityY);
    star(ctx, cx - cityW / 2 - starR - zone.w * 0.02, cityY - citySize * 0.32, starR);
    star(ctx, cx + cityW / 2 + starR + zone.w * 0.02, cityY - citySize * 0.32, starR);
  }

  const title = (caption || '').trim().toUpperCase();
  // The city line above set a wide letter-spacing; the title must be measured
  // and drawn with none, or its ink outline and its gradient fill land at
  // different widths.
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  const titleSize = fitFont(ctx, '"Passion One", sans-serif', '', title, zone.h * 0.13, zone.w * 0.85);
  const titleY = zone.y + zone.h * 0.93;
  const grad = ctx.createLinearGradient(0, titleY - titleSize, 0, titleY);
  grad.addColorStop(0, '#7b2ff7');
  grad.addColorStop(0.55, '#e0218a');
  grad.addColorStop(1, '#ff9a3d');
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, titleSize * 0.14);
  ctx.strokeStyle = INK;
  ctx.strokeText(title, cx, titleY);
  ctx.fillStyle = grad;
  ctx.fillText(title, cx, titleY);

  const tag = (subtitle || '').trim().toUpperCase();
  const tagSize = Math.max(11, zone.h * 0.026);
  ctx.font = `${tagSize}px Anton, sans-serif`;
  try { ctx.letterSpacing = `${Math.round(zone.w * 0.012)}px`; } catch { /* older canvas */ }
  ctx.fillStyle = TAG_YELLOW;
  if (tag) ctx.fillText(tag, cx, zone.y + zone.h * 0.965);
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
}

// Magenta corner sash across the hero's top-left, text centred on the band
// so it can never slide off-canvas. Clipped to the hero rect.
function drawSash(ctx, hero, text) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(hero.x, hero.y, hero.w, hero.h);
  ctx.clip();
  const px = hero.x + hero.w * 0.16;
  const py = hero.y + hero.h * 0.16;
  const len = hero.w * 0.66;
  const thick = Math.max(18, hero.h * 0.055);
  ctx.translate(px, py);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = SASH_MAGENTA;
  ctx.fillRect(-len / 2, -thick / 2, len, thick);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.round(thick * 0.52)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1);
  ctx.restore();
}

// opts: { photos, layout, grade, caption, city, subtitle, size,
//         captions, showCaptions, views }
// photos: array of images; panel i shows photos[rect.photo].
export function drawCover(canvas, opts) {
  const ctx = canvas.getContext('2d');
  const [W, H] = SIZES[opts.size] || SIZES.wide;
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  ctx.fillStyle = '#0d0518';
  ctx.fillRect(0, 0, W, H);

  const { panels, heroIndex, titleZone } = panelRects(opts.layout || 'band', W, H);
  const photos = opts.photos || [];
  panels.forEach((rect, i) => {
    const img = photos[rect.photo];
    if (!img) return;
    const isHero = i === heroIndex;
    // Hero keeps both faces whole: focal near the left face, a touch of zoom
    // on wide panels so the crop never slices a cheek.
    const focal = isHero ? { x: 0.16, y: 0.42 } : { x: 0.5, y: 0.5 };
    const wide = rect.w >= rect.h;
    const zoom = isHero ? (wide ? 1.15 : 1.0) : (rect.zoom || 1);
    const view = opts.views ? opts.views[i] : null;
    drawPanel(ctx, img, rect, opts.grade || 'photo', focal, zoom, view, rect.tilt);
    if (opts.showCaptions && opts.layout !== 'band' && opts.captions && opts.captions[i]) {
      const chip = opts.captions[i];
      ctx.font = `${Math.max(12, H * 0.018)}px Anton, sans-serif`;
      const tw = ctx.measureText(chip).width;
      ctx.fillStyle = 'rgba(16, 4, 32, 0.82)';
      ctx.fillRect(rect.x + 8, rect.y + rect.h - 34, tw + 20, 26);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(chip, rect.x + 18, rect.y + rect.h - 21);
    }
  });

  if (titleZone === 'hero' && heroIndex >= 0) {
    const hero = panels[heroIndex];
    drawSash(ctx, hero, 'ONE NIGHT ONLY');
    drawTitleBlock(ctx, hero, opts.caption, opts.city, opts.subtitle);
  } else {
    drawTitleBlock(ctx, { x: 0, y: 0, w: W, h: H }, opts.caption, opts.city, opts.subtitle);
  }
}

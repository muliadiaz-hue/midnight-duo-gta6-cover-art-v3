// Midnight Duo editor — wires the page: loads the vendored fonts and the five
// sample photos, keeps the editor state, redraws the canvas on every change,
// and handles pan/zoom, undo/redo and PNG export. `?shot=` scenes are set up
// by shots.js instead (see there).
import { drawCover, SIZES } from './cover.js';
import { panelRects } from './layouts.js';
import { freshViews, panelAt, nudgeView, snapshotViews } from './panels.js';
import { runShot } from './shots.js';

const SAMPLES = ['duo', 'car', 'heli', 'dj', 'boat'];
const FONTS = [
  ['Passion One', './fonts/PassionOne.ttf'],
  ['Anton', './fonts/Anton-Regular.ttf'],
  ['Pacifico', './fonts/Pacifico-Regular.ttf'],
];

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const $ = (id) => document.getElementById(id);

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${url}`));
    img.src = url;
  });
}

async function loadFonts() {
  await Promise.all(FONTS.map(async ([family, url]) => {
    const face = new FontFace(family, `url(${url})`);
    await face.load();
    document.fonts.add(face);
  }));
  await document.fonts.ready;
}

const state = {
  layout: 'band',
  grade: 'photo',
  caption: 'MIDNIGHT DUO',
  city: 'AZURA BAY',
  subtitle: 'TWO LEADS · ONE SCORE',
  size: 'wide',
  photos: [],
  views: freshViews(9),
  captions: {},
  showCaptions: false,
};

let undoStack = [];
let redoStack = [];

function snapshot() {
  return JSON.stringify({
    layout: state.layout,
    grade: state.grade,
    caption: state.caption,
    city: state.city,
    subtitle: state.subtitle,
    size: state.size,
    views: state.views,
    captions: state.captions,
    showCaptions: state.showCaptions,
  });
}

function restore(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  syncControls();
  redraw();
}

function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  syncUndoButtons();
}

function syncUndoButtons() {
  $('undo').disabled = undoStack.length === 0;
  $('redo').disabled = redoStack.length === 0;
}

function syncControls() {
  $('layout').value = state.layout;
  $('grade').value = state.grade;
  $('caption').value = state.caption;
  $('city').value = state.city;
  $('subtitle').value = state.subtitle;
  $('size').value = state.size;
  $('captions').checked = state.showCaptions;
}

function redraw() {
  drawCover(canvas, state);
}

function redrawAndMark(note) {
  redraw();
  if (note) status.textContent = note;
}

// --- controls ---------------------------------------------------------------
$('layout').addEventListener('change', (e) => { pushUndo(); state.layout = e.target.value; redraw(); });
$('grade').addEventListener('change', (e) => { pushUndo(); state.grade = e.target.value; redraw(); });
$('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
$('city').addEventListener('input', (e) => { state.city = e.target.value; redraw(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
$('size').addEventListener('change', (e) => { pushUndo(); state.size = e.target.value; redraw(); });
$('captions').addEventListener('change', (e) => { pushUndo(); state.showCaptions = e.target.checked; redraw(); });
$('undo').addEventListener('click', () => {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  syncUndoButtons();
});
$('redo').addEventListener('click', () => {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  syncUndoButtons();
});
$('resetView').addEventListener('click', () => {
  pushUndo();
  state.views = freshViews(9);
  redrawAndMark('View reset.');
});
$('export').addEventListener('click', () => {
  const [w, h] = SIZES[state.size];
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `midnight-duo-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved midnight-duo-${w}x${h}.png`;
  }, 'image/png');
});
$('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  pushUndo();
  state.photos[0] = await loadImage(URL.createObjectURL(file));
  redrawAndMark('Photo loaded as the hero.');
});

// --- sample tray ------------------------------------------------------------
const tray = $('tray');
SAMPLES.forEach((name, i) => {
  const thumb = document.createElement('img');
  thumb.src = `samples/${name}.jpg`;
  thumb.alt = name;
  thumb.addEventListener('click', () => {
    pushUndo();
    const [hero, ...rest] = state.photos;
    state.photos = [state.photos[i], ...state.photos.filter((_, j) => j !== i)];
    tray.querySelectorAll('img').forEach((el) => el.classList.remove('active'));
    thumb.classList.add('active');
    redrawAndMark(`${name} is the hero now.`);
  });
  tray.appendChild(thumb);
});

// --- drag to pan, scroll to zoom --------------------------------------------
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const [W, H] = SIZES[state.size];
  const idx = panelAt(panelRects(state.layout, W, H).panels, p.x, p.y);
  if (idx < 0) return;
  drag = { idx, x: p.x, y: p.y, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const dx = p.x - drag.x;
  const dy = p.y - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  state.views[drag.idx] = nudgeView(state.views[drag.idx], dx, dy, 1);
  drag.x = p.x;
  drag.y = p.y;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (drag && drag.moved) pushUndo();
  drag = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = canvasPoint(e);
  const [W, H] = SIZES[state.size];
  const idx = panelAt(panelRects(state.layout, W, H).panels, p.x, p.y);
  if (idx < 0) return;
  pushUndo();
  state.views[idx] = nudgeView(state.views[idx], 0, 0, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  redraw();
}, { passive: false });

// --- boot -------------------------------------------------------------------
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
try {
  await loadFonts();
  state.photos = await Promise.all(SAMPLES.map((n) => loadImage(`samples/${n}.jpg`)));
  if (shot) {
    await runShot(shot, params, state, redraw, loadImage);
  } else {
    tray.querySelector('img')?.classList.add('active');
    syncUndoButtons();
    redraw();
  }
} catch (err) {
  status.textContent = `Could not start: ${err.message}`;
  throw err;
}

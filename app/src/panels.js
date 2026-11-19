// Panel state — the editor's per-panel view (pan + zoom) and captions.
// A view is { dx, dy, zoom }: pixels panned and extra zoom on top of the
// cover fit. Views are plain data, so undo/redo can snapshot them with JSON.

// One fresh view per panel.
export function freshViews(count) {
  return Array.from({ length: count }, () => ({ dx: 0, dy: 0, zoom: 1 }));
}

// Finds which panel rect (from layouts.panelRects) holds point (x, y) in
// canvas pixels, or -1 when the point lands on a gutter.
export function panelAt(rects, x, y) {
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return i;
  }
  return -1;
}

// Moves a view by (dx, dy) canvas pixels and multiplies its zoom, keeping the
// zoom inside the range the editor allows.
export function nudgeView(view, dx, dy, zoomFactor) {
  const next = { ...view };
  next.dx += dx;
  next.dy += dy;
  next.zoom = Math.min(3, Math.max(0.5, next.zoom * zoomFactor));
  return next;
}

// Deep-clones a views array (and the captions map) for an undo snapshot.
export function snapshotViews(views, captions) {
  return {
    views: views.map((v) => ({ ...v })),
    captions: { ...captions },
  };
}

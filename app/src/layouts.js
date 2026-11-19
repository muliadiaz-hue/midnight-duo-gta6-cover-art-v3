// Cover layouts — pure geometry. Each layout returns the panel rects for a
// canvas of W×H, the index of the hero panel (the one that carries the title
// block in the band layout), and where the title block lives.
// Panel photos are indices into the photos array: 0 is the hero (duo), then
// car, heli, dj, boat in reading order.
export function panelRects(layout, W, H) {
  const g = Math.max(4, Math.round(W * 0.005)); // ink gutter
  const wide = W > H;
  switch (layout) {
    case 'band': {
      if (wide) {
        const hw = Math.round(W * 0.56);
        const rx = hw + g;
        const rw = W - rx;
        const rh = Math.floor((H - g) / 2);
        return {
          heroIndex: 0,
          titleZone: 'hero',
          panels: [
            { photo: 0, x: 0, y: 0, w: hw, h: H },
            { photo: 1, x: rx, y: 0, w: Math.floor((rw - g) / 2), h: rh },
            { photo: 2, x: rx + Math.floor((rw - g) / 2) + g, y: 0, w: Math.ceil((rw - g) / 2), h: rh },
            { photo: 3, x: rx, y: rh + g, w: Math.floor((rw - g) / 2), h: H - rh - g },
            { photo: 4, x: rx + Math.floor((rw - g) / 2) + g, y: rh + g, w: Math.ceil((rw - g) / 2), h: H - rh - g },
          ],
        };
      }
      // Square and tall canvases: hero on top, 2×2 below, so both faces stay whole.
      const hh = Math.round(H * 0.56);
      const by = hh + g;
      const bh = H - by;
      const rh = Math.floor((bh - g) / 2);
      const cw = Math.floor((W - g) / 2);
      return {
        heroIndex: 0,
        titleZone: 'hero',
        panels: [
          { photo: 0, x: 0, y: 0, w: W, h: hh },
          { photo: 1, x: 0, y: by, w: cw, h: rh },
          { photo: 2, x: cw + g, y: by, w: W - cw - g, h: rh },
          { photo: 3, x: 0, y: by + rh + g, w: cw, h: bh - rh - g },
          { photo: 4, x: cw + g, y: by + rh + g, w: W - cw - g, h: bh - rh - g },
        ],
      };
    }
    case 'nine': {
      const cw = Math.floor((W - g * 2) / 3);
      const ch = Math.floor((H - g * 2) / 3);
      const order = [0, 1, 2, 3, 4, 1, 2, 3, 0];
      const panels = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          panels.push({
            photo: order[r * 3 + c],
            x: c * (cw + g),
            y: r * (ch + g),
            w: cw,
            h: ch,
          });
        }
      }
      return { heroIndex: -1, titleZone: 'bottom', panels };
    }
    case 'hero':
      return { heroIndex: -1, titleZone: 'bottom', panels: [{ photo: 0, x: 0, y: 0, w: W, h: H }] };
    case 'bleed':
      return { heroIndex: -1, titleZone: 'bottom', panels: [{ photo: 0, x: 0, y: 0, w: W, h: H, zoom: 1.06 }] };
    case 'tilted': {
      const cw = Math.floor((W - g * 4) / 5);
      const ch = Math.floor(H * 0.78);
      const y0 = Math.floor((H - ch) / 2);
      const tilts = [-3, 2, -2, 3, -3];
      return {
        heroIndex: -1,
        titleZone: 'bottom',
        panels: [0, 1, 2, 3, 4].map((p, i) => ({
          photo: p, x: i * (cw + g), y: y0, w: cw, h: ch, tilt: tilts[i],
        })),
      };
    }
    case 'diptych': {
      const cw = Math.floor((W - g) / 2);
      return {
        heroIndex: -1,
        titleZone: 'bottom',
        panels: [
          { photo: 0, x: 0, y: 0, w: cw, h: H },
          { photo: 1, x: cw + g, y: 0, w: W - cw - g, h: H },
        ],
      };
    }
    case 'strip': {
      const cw = Math.floor((W - g * 4) / 5);
      const ch = Math.floor(H * 0.62);
      const y0 = Math.floor((H - ch) / 2);
      return {
        heroIndex: -1,
        titleZone: 'bottom',
        panels: [0, 1, 2, 3, 4].map((p, i) => ({
          photo: p, x: i * (cw + g), y: y0, w: cw, h: ch,
        })),
      };
    }
    default:
      return panelRects('band', W, H);
  }
}

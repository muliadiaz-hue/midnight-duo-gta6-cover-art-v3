// Fixed scenes for screenshots: `?shot=editor` shows the page with the duo
// loaded; `?shot=cover` shows the cover alone, full-viewport. Query params:
// layout, grade, size (wide/square/portrait/story), caption, city, subtitle,
// photo (sample name or index for the hero). window.__shotReady is set once
// the cover has painted.
export async function runShot(shot, query, state, redraw, loadImage) {
  const pick = (name, fallback) => query.get(name) ?? fallback;
  if (shot === 'cover') document.body.classList.add('shot-cover');
  state.layout = pick('layout', 'band');
  state.grade = pick('grade', 'photo');
  state.size = pick('size', 'wide');
  state.caption = pick('caption', 'MIDNIGHT DUO');
  state.city = pick('city', 'AZURA BAY');
  state.subtitle = pick('subtitle', 'TWO LEADS · ONE SCORE');
  const hero = pick('photo', null);
  if (hero) {
    const names = ['duo', 'car', 'heli', 'dj', 'boat'];
    const idx = names.indexOf(hero);
    const img = idx >= 0 ? state.photos[idx] : await loadImage(`samples/${hero}.jpg`);
    if (img) state.photos = [img, ...state.photos.filter((p) => p !== img)];
  }
  document.getElementById('layout').value = state.layout;
  document.getElementById('grade').value = state.grade;
  document.getElementById('size').value = state.size;
  document.getElementById('caption').value = state.caption;
  document.getElementById('city').value = state.city;
  document.getElementById('subtitle').value = state.subtitle;
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}

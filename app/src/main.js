// Panel Pop's editor: wires the controls to the cover renderer. Photos are read locally and never leave the
// page; the cover is redrawn on the preview canvas after every change, and Export renders it clean at the
// chosen size. A `?shot=` query sets up a fixed scene for screenshots instead (./shots.js).
import { drawCover, GRADES, gradeById } from './cover.js';
import { LAYOUTS, layoutById, drawLayoutThumb, panelBox, pointInPanel } from './layouts.js';
import { shotConfig } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');

const state = {
  photos: [],
  photoNames: [],
  layout: LAYOUTS[0],
  panels: [],
  grade: 'vice',
  caption: 'Leonida Heat',
  captionSize: 1.1,
  captionPos: 'bottom',
  arch: false,
  badge: true,
  borderColor: '#0a0a0c',
  borderWidth: 11,
  finish: 'grain',
  selected: 0,
};

/** Fresh panel views for a layout: photos dealt round-robin, every photo centred at natural cover size. */
function freshPanels(layout) {
  return layout.panels.map((_, i) => ({
    photo: state.photos.length ? i % state.photos.length : 0,
    zoom: 1,
    ox: 0,
    oy: 0,
  }));
}

function redraw(preview = true) {
  drawCover(canvas, state, { preview });
  markStrip();
  $('panel-label').textContent =
    `Panel ${state.selected + 1} of ${state.layout.panels.length} · photo: ${state.photoNames[state.panels[state.selected]?.photo] ?? 'none'}. ` +
    'Drag it on the cover to pan, scroll to zoom.';
  $('zoom').value = Math.round((state.panels[state.selected]?.zoom ?? 1) * 100);
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Adds a loaded image to the photo set and the strip. */
function addPhoto(img, name) {
  state.photos.push(img);
  state.photoNames.push(name);
  const btn = document.createElement('button');
  btn.type = 'button';
  const thumb = document.createElement('img');
  thumb.src = img.src;
  thumb.alt = name;
  btn.appendChild(thumb);
  const index = state.photos.length - 1;
  btn.addEventListener('click', () => {
    state.panels[state.selected].photo = index;
    redraw();
  });
  $('strip').appendChild(btn);
  return index;
}

/** Outlines the strip photo the selected panel is using. */
function markStrip() {
  const used = state.panels[state.selected]?.photo;
  [...$('strip').children].forEach((btn, i) => btn.classList.toggle('on', i === used));
}

/** Loads one of the bundled samples by name ('pier' or 'boulevard'). */
async function addSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  return addPhoto(img, `${name[0].toUpperCase() + name.slice(1)} (sample)`);
}

// ---------------------------------------------------------------- controls

function buildLayouts() {
  for (const layout of LAYOUTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    const thumb = document.createElement('canvas');
    thumb.width = 240;
    thumb.height = 128;
    drawLayoutThumb(thumb, layout, '#ff2e88');
    const name = document.createElement('span');
    name.className = 'lname';
    name.textContent = layout.name;
    const note = document.createElement('span');
    note.className = 'lnote';
    note.textContent = layout.note;
    btn.append(thumb, name, note);
    btn.classList.toggle('on', layout.id === state.layout.id);
    btn.addEventListener('click', () => {
      const keep = state.panels;
      state.layout = layout;
      state.panels = layout.panels.map((_, i) => keep[i] ?? { photo: state.photos.length ? i % state.photos.length : 0, zoom: 1, ox: 0, oy: 0 });
      state.selected = Math.min(state.selected, layout.panels.length - 1);
      [...$('layouts').children].forEach((b, i) => b.classList.toggle('on', LAYOUTS[i].id === layout.id));
      redraw();
    });
    $('layouts').appendChild(btn);
  }
}

function buildGrades() {
  for (const grade of GRADES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = grade.name;
    btn.style.background = grade.swatch;
    btn.classList.toggle('on', grade.id === state.grade);
    btn.addEventListener('click', () => {
      state.grade = grade.id;
      [...$('grades').children].forEach((b, i) => b.classList.toggle('on', GRADES[i].id === grade.id));
      redraw();
    });
    $('grades').appendChild(btn);
  }
}

function wireControls() {
  $('photo').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      const img = await loadImage(URL.createObjectURL(file));
      const index = addPhoto(img, file.name);
      state.panels[state.selected].photo = index;
    }
    if (state.photos.length && state.panels.every((p) => !state.photos[p.photo])) state.panels = freshPanels(state.layout);
    redraw();
  });
  $('sample-pier').addEventListener('click', async () => { state.panels[state.selected].photo = await addSample('pier'); redraw(); });
  $('sample-boulevard').addEventListener('click', async () => { state.panels[state.selected].photo = await addSample('boulevard'); redraw(); });

  $('zoom').addEventListener('input', (e) => {
    state.panels[state.selected].zoom = Number(e.target.value) / 100;
    redraw();
  });
  $('fill-all').addEventListener('click', () => {
    const photo = state.panels[state.selected].photo;
    for (const panel of state.panels) panel.photo = photo;
    redraw();
  });
  $('reset-view').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    panel.zoom = 1; panel.ox = 0; panel.oy = 0;
    redraw();
  });

  $('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
  $('cap-size').addEventListener('input', (e) => { state.captionSize = Number(e.target.value) / 100; redraw(); });
  $('cap-top').addEventListener('click', () => setCaptionPos('top'));
  $('cap-bottom').addEventListener('click', () => setCaptionPos('bottom'));
  $('cap-arch').addEventListener('change', (e) => { state.arch = e.target.checked; redraw(); });
  $('badge').addEventListener('change', (e) => { state.badge = e.target.checked; redraw(); });

  $('finish').addEventListener('change', (e) => { state.finish = e.target.value; redraw(); });
  document.querySelectorAll('[data-border]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.borderColor = btn.dataset.border;
      document.querySelectorAll('[data-border]').forEach((b) => b.classList.toggle('on', b === btn));
      redraw();
    });
  });
  $('border-width').addEventListener('input', (e) => { state.borderWidth = Number(e.target.value); redraw(); });

  $('size').addEventListener('change', (e) => {
    const [w, h] = e.target.value.split('x').map(Number);
    canvas.width = w;
    canvas.height = h;
    redraw();
  });
  $('export').addEventListener('click', () => {
    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    drawCover(out, state, { preview: false });
    out.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `panel-pop-cover-${out.width}x${out.height}.png`;
      a.click();
      $('status').textContent = `Saved panel-pop-cover-${out.width}x${out.height}.png`;
    }, 'image/png');
  });
}

function setCaptionPos(pos) {
  state.captionPos = pos;
  $('cap-top').classList.toggle('on', pos === 'top');
  $('cap-bottom').classList.toggle('on', pos === 'bottom');
  redraw();
}

// ---------------------------------------------------------------- canvas gestures

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function wireCanvas() {
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const p = canvasPoint(e);
    const hit = state.layout.panels.findIndex((panel) => pointInPanel(panel, p.x / canvas.width, p.y / canvas.height));
    if (hit >= 0) state.selected = hit;
    drag = { x: p.x, y: p.y };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = canvasPoint(e);
    const panel = state.panels[state.selected];
    const box = panelBox(state.layout.panels[state.selected]);
    panel.ox = Math.max(-1, Math.min(1, panel.ox + (p.x - drag.x) / (box.w * canvas.width)));
    panel.oy = Math.max(-1, Math.min(1, panel.oy + (p.y - drag.y) / (box.h * canvas.height)));
    drag = p;
    redraw();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[state.selected];
    panel.zoom = Math.max(0.5, Math.min(4, panel.zoom * Math.exp(-e.deltaY * 0.0012)));
    redraw();
  }, { passive: false });
}

// ---------------------------------------------------------------- start

/** Applies a screenshot scene (see shots.js), then signals readiness for the camera. */
async function applyShot(cfg) {
  const names = cfg.photos ?? ['pier', 'boulevard'];
  for (const name of names) await addSample(name);
  state.panels = freshPanels(state.layout);
  if (cfg.layout) {
    state.layout = layoutById(cfg.layout);
    state.panels = freshPanels(state.layout);
  }
  if (cfg.assign) cfg.assign.forEach((photo, i) => { if (state.panels[i]) state.panels[i].photo = photo; });
  if (cfg.views) cfg.views.forEach(([zoom, ox, oy], i) => {
    if (!state.panels[i]) return;
    state.panels[i].zoom = zoom || 1;
    state.panels[i].ox = ox || 0;
    state.panels[i].oy = oy || 0;
  });
  if (cfg.grade) state.grade = gradeById(cfg.grade).id;
  if (cfg.caption !== null) { state.caption = cfg.caption; $('caption').value = cfg.caption; }
  if (cfg.captionSize !== null) state.captionSize = cfg.captionSize;
  if (cfg.captionPos) state.captionPos = cfg.captionPos;
  state.arch = cfg.arch;
  state.badge = cfg.badge;
  if (cfg.border) state.borderColor = cfg.border;
  if (cfg.borderWidth !== null) state.borderWidth = cfg.borderWidth;
  if (cfg.finish) state.finish = cfg.finish;
  if (cfg.selected !== null) state.selected = Math.min(cfg.selected, state.layout.panels.length - 1);
  if (cfg.w && cfg.h) {
    canvas.width = cfg.w;
    canvas.height = cfg.h;
    $('size').value = `${cfg.w}x${cfg.h}`;
  }
  if (cfg.shot === 'cover') document.body.classList.add('shot-cover');
  await document.fonts.ready;
  redraw(cfg.shot !== 'cover');
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

async function start() {
  buildLayouts();
  buildGrades();
  wireControls();
  wireCanvas();
  const cfg = shotConfig();
  if (cfg) {
    await applyShot(cfg);
    return;
  }
  await addSample('pier');
  await addSample('boulevard');
  state.panels = freshPanels(state.layout);
  await document.fonts.ready;
  redraw();
}

start();

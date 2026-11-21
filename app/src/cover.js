// Panel Pop's cover renderer: draws the whole poster onto a canvas 2D context — angled photo panels, a colour
// grade, a print finish, heavy divider strokes, a poster caption with outline and hard shadow, and a hand-drawn
// sun-and-palm badge. Everything is drawn from the photos and the state; nothing is fetched.

import { panelBox } from './layouts.js';

export const GRADES = [
  {
    id: 'vice',
    name: 'Vice Sunset',
    swatch: 'linear-gradient(160deg, #ff9a3c, #ff2e88 55%, #3b1163)',
    filter: 'saturate(1.5) contrast(1.13) brightness(1.06)',
    overlays: [
      { stops: [[0, 'rgba(255, 110, 48, 0.42)'], [0.52, 'rgba(255, 0, 128, 0.27)'], [1, 'rgba(43, 10, 92, 0.55)']], mode: 'overlay', angle: 'v' },
      { stops: [[0.55, 'rgba(255, 150, 40, 0)'], [1, 'rgba(255, 120, 30, 0.26)']], mode: 'soft-light', angle: 'v' },
      { stops: [[0, 'rgba(255, 170, 60, 0.16)'], [0.4, 'rgba(255, 170, 60, 0)']], mode: 'soft-light', angle: 'v' },
    ],
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    swatch: 'linear-gradient(100deg, #00e5ff, #30135e 50%, #ff00aa)',
    filter: 'saturate(1.55) contrast(1.18) brightness(1.02)',
    overlays: [
      { stops: [[0, 'rgba(0, 229, 255, 0.30)'], [0.5, 'rgba(0, 229, 255, 0)'], [1, 'rgba(255, 0, 170, 0.30)']], mode: 'overlay', angle: 'h' },
      { stops: [[0, 'rgba(110, 0, 255, 0.20)'], [0.6, 'rgba(110, 0, 255, 0)'], [1, 'rgba(6, 0, 40, 0.34)']], mode: 'overlay', angle: 'v' },
    ],
  },
  {
    id: 'classic',
    name: 'Classic',
    swatch: 'linear-gradient(160deg, #ffd23c, #ff7a3c 55%, #7a2b8f)',
    filter: 'saturate(1.32) contrast(1.1) brightness(1.04)',
    overlays: [
      { stops: [[0.5, 'rgba(255, 130, 50, 0)'], [1, 'rgba(255, 110, 40, 0.20)']], mode: 'soft-light', angle: 'v' },
      { stops: [[0, 'rgba(255, 220, 130, 0.12)'], [0.45, 'rgba(255, 220, 130, 0)']], mode: 'soft-light', angle: 'v' },
    ],
  },
  {
    id: 'mono',
    name: 'Mono Grit',
    swatch: 'linear-gradient(160deg, #e8e8e8, #6a6a6a 55%, #101010)',
    filter: 'grayscale(1) contrast(1.3) brightness(1.03)',
    overlays: [
      { stops: [[0, 'rgba(0, 0, 0, 0.10)'], [0.5, 'rgba(0, 0, 0, 0)'], [1, 'rgba(0, 0, 0, 0.22)']], mode: 'multiply', angle: 'v' },
    ],
  },
];

/** The grade with this id, or the first grade when the id is unknown. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

/** Traces a panel polygon as the current path, in canvas pixels. */
function tracePanel(ctx, panel, w, h) {
  ctx.beginPath();
  panel.points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x * w, y * h) : ctx.lineTo(x * w, y * h)));
  ctx.closePath();
}

/** Draws one panel's photo, clipped to its polygon: cover-fit on the polygon's box, then the panel's pan/zoom. */
function drawPanelPhoto(ctx, panel, view, img, filter, w, h) {
  const box = panelBox(panel);
  const bx = box.x * w, by = box.y * h, bw = box.w * w, bh = box.h * h;
  ctx.save();
  tracePanel(ctx, panel, w, h);
  ctx.clip();
  if (!img) {
    const g = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    g.addColorStop(0, '#31204d');
    g.addColorStop(1, '#170d29');
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = `700 ${Math.max(13, bh * 0.09)}px CoverDisplay, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', bx + bw / 2, by + bh / 2);
    ctx.restore();
    return;
  }
  const scale = Math.max(bw / img.naturalWidth, bh / img.naturalHeight) * view.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = bx + bw / 2 - dw / 2 + view.ox * bw * 0.5;
  const dy = by + bh / 2 - dh / 2 + view.oy * bh * 0.5;
  ctx.filter = filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

/** One full-canvas gradient wash of a grade. */
function drawOverlay(ctx, overlay, w, h) {
  const grad = overlay.angle === 'h' ? ctx.createLinearGradient(0, 0, w, 0) : ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, colour] of overlay.stops) grad.addColorStop(at, colour);
  ctx.save();
  ctx.globalCompositeOperation = overlay.mode;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** A soft dark edge all the way round, so the poster feels printed rather than pasted. */
function drawVignette(ctx, w, h) {
  const r = Math.hypot(w, h) / 2;
  const grad = ctx.createRadialGradient(w / 2, h / 2, r * 0.52, w / 2, h / 2, r * 1.02);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(5, 0, 16, 0.40)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

let grainTile = null;
/** A 256px tile of random grey noise, made once and reused as a pattern. */
function grainPattern(ctx) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = grainTile.height = 256;
    const g = grainTile.getContext('2d');
    const data = g.createImageData(256, 256);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = 96 + Math.floor(Math.random() * 96);
      data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    g.putImageData(data, 0, 0);
  }
  return ctx.createPattern(grainTile, 'repeat');
}

let dotTile = null;
/** A small halftone dot tile, made once. */
function dotPattern(ctx) {
  if (!dotTile) {
    dotTile = document.createElement('canvas');
    dotTile.width = dotTile.height = 14;
    const g = dotTile.getContext('2d');
    g.fillStyle = '#000';
    g.beginPath();
    g.arc(7, 7, 3.4, 0, Math.PI * 2);
    g.fill();
  }
  return ctx.createPattern(dotTile, 'repeat');
}

/** The print finish over the graded panels: film grain or halftone dots. */
function drawFinish(ctx, finish, w, h) {
  if (finish === 'clean') return;
  ctx.save();
  if (finish === 'grain') {
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = grainPattern(ctx);
  } else {
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = dotPattern(ctx);
  }
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** The caption's lines: the words split over at most two lines, balanced by character count. */
function captionLines(text) {
  const words = text.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  if (words.length === 1) return [words[0]];
  let best = 1, bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ').length;
    const b = words.slice(i).join(' ').length;
    if (Math.abs(a - b) < bestDiff) { bestDiff = Math.abs(a - b); best = i; }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

/** One caption line's glyphs laid out: plain, or along a shallow arch when `arch` is set. */
function drawCaptionLine(ctx, line, cx, y, size, arch) {
  ctx.font = `700 ${size}px CoverDisplay, 'DejaVu Sans', sans-serif`;
  if (!arch) {
    ctx.fillText(line, cx, y);
    return;
  }
  const widths = [...line].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0);
  const rise = size * 0.30;
  let pen = cx - total / 2;
  [...line].forEach((ch, i) => {
    const t = total === 0 ? 0.5 : (pen - (cx - total / 2) + widths[i] / 2) / total;
    const lift = rise * (1 - Math.pow(2 * t - 1, 2));
    const tilt = (t - 0.5) * 0.30;
    ctx.save();
    ctx.translate(pen + widths[i] / 2, y - lift);
    ctx.rotate(tilt);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    pen += widths[i];
  });
}

/**
 * The poster caption: heavy display lettering, white fill, thick black outline, hard drop shadow, slightly
 * sheared for speed. Three passes (shadow, outline, fill) so each glyph keeps a crisp edge.
 */
function drawCaption(ctx, state, w, h) {
  const lines = captionLines(state.caption);
  if (lines.length === 0) return;
  let size = h * 0.115 * state.captionSize;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const setFont = () => { ctx.font = `700 ${size}px CoverDisplay, 'DejaVu Sans', sans-serif`; };
  setFont();
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  while (widest > w * 0.92 && size > 10) {
    size *= (w * 0.92) / widest;
    setFont();
  }
  const lineGap = size * 1.04;
  const blockH = size + (lines.length - 1) * lineGap;
  const baseY = state.captionPos === 'top' ? h * 0.055 + size : h * 0.945 - blockH + size;
  const passes = [
    { dx: size * 0.06, dy: size * 0.075, style: '#000000', mode: 'shadow' },
    { dx: 0, dy: 0, style: '#0a0a0c', mode: 'stroke' },
    { dx: 0, dy: 0, style: '#ffffff', mode: 'fill' },
  ];
  for (const pass of passes) {
    ctx.save();
    // A slight italic shear, compensated so the block stays centred at this height.
    const shear = -0.10;
    ctx.transform(1, 0, shear, 1, -shear * (baseY), 0);
    ctx.translate(pass.dx, pass.dy);
    if (pass.mode === 'stroke') {
      ctx.strokeStyle = pass.style;
      ctx.lineWidth = size * 0.20;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
    } else {
      ctx.fillStyle = pass.style;
    }
    lines.forEach((line, i) => {
      const y = baseY + i * lineGap;
      if (pass.mode === 'stroke') {
        if (state.arch) {
          // Stroke each glyph along the same arch the fill pass uses.
          strokeArchLine(ctx, line, w / 2, y, size);
        } else {
          ctx.strokeText(line, w / 2, y);
        }
      } else {
        drawCaptionLine(ctx, line, w / 2, y, size, state.arch);
      }
    });
    ctx.restore();
  }
}

/** Strokes one caption line glyph by glyph along the arch (the outline pass for arched captions). */
function strokeArchLine(ctx, line, cx, y, size) {
  ctx.font = `700 ${size}px CoverDisplay, 'DejaVu Sans', sans-serif`;
  ctx.textAlign = 'center';
  const widths = [...line].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0);
  const rise = size * 0.30;
  let pen = cx - total / 2;
  [...line].forEach((ch, i) => {
    const t = total === 0 ? 0.5 : (pen - (cx - total / 2) + widths[i] / 2) / total;
    const lift = rise * (1 - Math.pow(2 * t - 1, 2));
    const tilt = (t - 0.5) * 0.30;
    ctx.save();
    ctx.translate(pen + widths[i] / 2, y - lift);
    ctx.rotate(tilt);
    ctx.strokeText(ch, 0, 0);
    ctx.restore();
    pen += widths[i];
  });
}

/**
 * The badge: an original emblem drawn with paths — a ring, a striped sunset disc, a palm silhouette against
 * it, and the numerals VI at its foot. No artwork but these shapes.
 */
function drawBadge(ctx, state, w, h) {
  const s = Math.min(w, h) * 0.21;
  const margin = Math.min(w, h) * 0.035;
  const cx = state.captionPos === 'top' ? w - margin - s / 2 : w - margin - s / 2;
  const cy = state.captionPos === 'top' ? h - margin - s / 2 : margin + s / 2;
  const r = s / 2;
  ctx.save();
  ctx.translate(cx, cy);
  // Disc and ring.
  const disc = ctx.createLinearGradient(0, -r, 0, r);
  disc.addColorStop(0, '#2b1055');
  disc.addColorStop(0.55, '#7a1e6e');
  disc.addColorStop(1, '#1a0b2e');
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = disc;
  ctx.fill();
  ctx.lineWidth = s * 0.055;
  ctx.strokeStyle = '#ffc93c';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
  ctx.lineWidth = s * 0.016;
  ctx.strokeStyle = 'rgba(255, 201, 60, 0.65)';
  ctx.stroke();
  // The sun: a striped half-disc.
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
  ctx.clip();
  const sun = ctx.createLinearGradient(0, -r * 0.5, 0, r * 0.35);
  sun.addColorStop(0, '#ffe259');
  sun.addColorStop(0.6, '#ff7a3c');
  sun.addColorStop(1, '#ff2e88');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(0, r * 0.10, r * 0.52, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(26, 11, 46, 0.85)';
  for (let i = 0; i < 3; i++) ctx.fillRect(-r, r * 0.10 - (i + 1) * r * 0.13, r * 2, r * 0.045);
  // Sea line.
  ctx.fillStyle = '#12081f';
  ctx.fillRect(-r, r * 0.10, r * 2, r);
  ctx.restore();
  // The palm: a curved trunk and five fronds, in silhouette.
  ctx.strokeStyle = '#0d0518';
  ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.045;
  ctx.beginPath();
  ctx.moveTo(-r * 0.08, r * 0.55);
  ctx.quadraticCurveTo(-r * 0.02, r * 0.05, r * 0.10, -r * 0.28);
  ctx.stroke();
  ctx.lineWidth = s * 0.034;
  const topX = r * 0.10, topY = -r * 0.28;
  const fronds = [[-0.55, -0.30], [-0.30, -0.52], [0.05, -0.58], [0.38, -0.48], [0.58, -0.22]];
  for (const [fx, fy] of fronds) {
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + fx * r * 0.55, topY + fy * r * 0.4, topX + fx * r, topY + fy * r + r * 0.16);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX - r * 0.07, topY + r * 0.05, r * 0.05, 0, Math.PI * 2);
  ctx.arc(topX + r * 0.07, topY + r * 0.07, r * 0.042, 0, Math.PI * 2);
  ctx.fillStyle = '#0d0518';
  ctx.fill();
  // The numerals.
  ctx.font = `700 ${s * 0.30}px CoverDisplay, 'DejaVu Sans', sans-serif`;
  ctx.textAlign = 'center';
  ctx.lineWidth = s * 0.045;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#0a0a0c';
  ctx.strokeText('VI', 0, r * 0.78);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('VI', 0, r * 0.78);
  ctx.restore();
}

/**
 * Draws the full cover described by `state` onto `canvas`. With `preview` true the selected panel gets a
 * highlight outline; exports pass false so the artwork stays clean.
 */
export function drawCover(canvas, state, { preview = false } = {}) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = gradeById(state.grade);
  ctx.fillStyle = '#0b0714';
  ctx.fillRect(0, 0, w, h);
  state.layout.panels.forEach((panel, i) => {
    drawPanelPhoto(ctx, panel, state.panels[i], state.photos[state.panels[i].photo] ?? null, grade.filter, w, h);
  });
  for (const overlay of grade.overlays) drawOverlay(ctx, overlay, w, h);
  drawFinish(ctx, state.finish, w, h);
  drawVignette(ctx, w, h);
  // Divider strokes and the outer frame, over the graded photos so they stay punchy.
  const bw = state.borderWidth * (w / 1080);
  if (bw > 0) {
    ctx.strokeStyle = state.borderColor;
    ctx.lineWidth = bw;
    ctx.lineJoin = 'miter';
    for (const panel of state.layout.panels) {
      tracePanel(ctx, panel, w, h);
      ctx.stroke();
    }
    ctx.lineWidth = bw * 1.4;
    ctx.strokeRect(0, 0, w, h);
  }
  drawCaption(ctx, state, w, h);
  if (state.badge) drawBadge(ctx, state, w, h);
  if (preview && state.selected >= 0) {
    const panel = state.layout.panels[state.selected];
    if (panel) {
      ctx.save();
      tracePanel(ctx, panel, w, h);
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = Math.max(3, w * 0.006);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    }
  }
}

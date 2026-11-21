// Panel layouts for Panel Pop: each layout is a set of polygons in unit space (x and y in 0..1), scaled to the
// canvas at draw time. The cuts are angled on purpose — slanted dividers are what make a collage read as a
// poster instead of a spreadsheet. Neighbouring panels share their edge coordinates so the frame has no gaps.

/** One panel: a polygon as [x, y] points in unit space, in drawing order. */
const P = (points) => ({ points });

export const LAYOUTS = [
  {
    id: 'vice-hero',
    name: 'Vice Hero',
    note: 'One tall hero panel, three stacked cuts',
    panels: [
      P([[0, 0], [0.58, 0], [0.5, 1], [0, 1]]),
      P([[0.58, 0], [1, 0], [1, 0.36], [0.551, 0.36]]),
      P([[0.551, 0.36], [1, 0.36], [1, 0.68], [0.526, 0.68]]),
      P([[0.526, 0.68], [1, 0.68], [1, 1], [0.5, 1]]),
    ],
  },
  {
    id: 'five-alarm',
    name: 'Five Alarm',
    note: 'A wide banner over a slanted trio',
    panels: [
      P([[0, 0], [1, 0], [1, 0.42], [0, 0.5]]),
      P([[0, 0.5], [0.36, 0.471], [0.33, 1], [0, 1]]),
      P([[0.36, 0.471], [0.68, 0.446], [0.66, 1], [0.33, 1]]),
      P([[0.68, 0.446], [1, 0.42], [1, 1], [0.66, 1]]),
    ],
  },
  {
    id: 'six-pack',
    name: 'Six Pack',
    note: 'Two rows of three, every cut leaning',
    panels: [
      P([[0, 0], [0.36, 0], [0.33, 0.48], [0, 0.52]]),
      P([[0.36, 0], [0.68, 0], [0.66, 0.46], [0.33, 0.48]]),
      P([[0.68, 0], [1, 0], [1, 0.44], [0.66, 0.46]]),
      P([[0, 0.52], [0.33, 0.48], [0.34, 1], [0, 1]]),
      P([[0.33, 0.48], [0.66, 0.46], [0.67, 1], [0.34, 1]]),
      P([[0.66, 0.46], [1, 0.44], [1, 1], [0.67, 1]]),
    ],
  },
  {
    id: 'hero-trio',
    name: 'Hero Trio',
    note: 'A portrait hero shot over two panels',
    panels: [
      P([[0, 0], [1, 0], [1, 0.55], [0, 0.62]]),
      P([[0, 0.62], [0.52, 0.584], [0.5, 1], [0, 1]]),
      P([[0.52, 0.584], [1, 0.55], [1, 1], [0.5, 1]]),
    ],
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    note: 'Four wide panels pinned around a slant',
    panels: [
      P([[0, 0], [0.62, 0], [0.58, 0.52], [0, 0.52]]),
      P([[0.62, 0], [1, 0], [1, 0.52], [0.58, 0.52]]),
      P([[0, 0.52], [0.58, 0.52], [0.62, 1], [0, 1]]),
      P([[0.58, 0.52], [1, 0.52], [1, 1], [0.62, 1]]),
    ],
  },
];

/** The layout with this id, or the first layout when the id is unknown. */
export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

/** A polygon's bounding box in unit space. */
export function panelBox(panel) {
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (const [x, y] of panel.points) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Whether a unit-space point falls inside a panel polygon (ray casting). */
export function pointInPanel(panel, px, py) {
  const pts = panel.points;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Draws a layout's panels as filled shapes on a small canvas, for the editor's layout picker thumbnails. */
export function drawLayoutThumb(canvas, layout, accent) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  ctx.fillStyle = '#241a38';
  ctx.fillRect(0, 0, w, h);
  const shades = ['#ff5e7a', '#ffb03a', '#3ac6ff', '#8a5cff', '#3affa8', '#ff3a3a'];
  layout.panels.forEach((panel, i) => {
    ctx.beginPath();
    panel.points.forEach(([x, y], k) => (k === 0 ? ctx.moveTo(x * w, y * h) : ctx.lineTo(x * w, y * h)));
    ctx.closePath();
    ctx.fillStyle = i === 0 ? accent : shades[i % shades.length];
    ctx.globalAlpha = i === 0 ? 1 : 0.75;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#0b0714';
    ctx.lineWidth = 3;
    ctx.stroke();
  });
}

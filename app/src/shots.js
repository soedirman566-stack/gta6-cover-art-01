// Fixed scenes for screenshots: a `?shot=` query describes one scene and main.js applies it, so a headless
// browser can render the editor or a finished cover exactly as a visitor would make it.
//   ?shot=cover   the cover alone, full-bleed, at the export size named by w and h
//   ?shot=editor  the editor with the scene's photos loaded and its panels filled
// Scene parameters: layout, grade, caption, photos (sample names, comma-separated), assign (photo index per
// panel), views (per-panel "zoom,ox,oy" groups separated by ';'), border, borderw, finish, badge, cappos,
// capsize, arch, sel (the highlighted panel in the editor).

/** The scene the query string describes, or null when the page was opened without one. */
export function shotConfig() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (!shot) return null;
  const list = (key) => {
    const v = q.get(key);
    return v ? v.split(',') : null;
  };
  const num = (key) => {
    const v = q.get(key);
    return v === null ? null : Number(v);
  };
  return {
    shot,
    w: num('w') ?? 0,
    h: num('h') ?? 0,
    layout: q.get('layout'),
    grade: q.get('grade'),
    caption: q.get('caption'),
    photos: list('photos'),
    assign: list('assign')?.map(Number) ?? null,
    views: q.get('views') ? q.get('views').split(';').map((g) => g.split(',').map(Number)) : null,
    border: q.get('border'),
    borderWidth: num('borderw'),
    finish: q.get('finish'),
    badge: q.get('badge') !== '0',
    captionPos: q.get('cappos'),
    captionSize: num('capsize'),
    arch: q.get('arch') === '1',
    selected: num('sel'),
  };
}

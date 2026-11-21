[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/soedirman566-stack/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/soedirman566-stack/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Panel Pop — GTA-style Cover Art Maker

Panel Pop turns your own photos into bold, multi-panel cover art in the style of a GTA poster. Pick one of five angled collage layouts — Vice Hero, Five Alarm, Six Pack, Hero Trio, or Cinematic — drop your photos into the panels, and drag and zoom each one until it sits just right. Finish the poster with one of four colour grades (Vice Sunset, Neon Nights, Classic, or Mono Grit), add grain or halftone texture, and stamp it with your own caption in heavy poster lettering next to an original canvas-drawn badge. When it looks right, export a share-ready PNG at 1080×1080, 1080×1350, or 1920×1080.

Everything is drawn live on a canvas in a plain static web app under `app/` — no build step, no uploads, no accounts.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in your browser. The app runs entirely offline from its own files, and your photos never leave your machine — they are read locally and only ever drawn into the poster you export.

Built for the [gta6-cover-art-01 bounty on make.fun](https://make.fun/bounty/gta6-cover-art-01).

## License

MIT

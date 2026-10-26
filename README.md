# Portfolio

A dark, grid-driven one-page portfolio: split-flap hero, a 3D work gallery that
travels past the camera on scroll, a thirteen-camera "surveillance" wall, an
accordion FAQ pinned behind a sticky title, and a contact screen with a masked
silhouette and an animated fringe.

Everything is static: no framework, no build step, no dependencies. Open
`index.html` and it runs.

## Layout

```
index.html                 single page
assets/css/style.css       all styles (design tokens at the top)
assets/js/
  data.js                  shared helpers plus the WORK / MONITORS / FAQ content
  intro.js                 boot overlay: particle star, then the split
  chrome.js                custom cursor, theme glitch, nav logo, hero grid
  field.js                 interactive dot field and the rotating label pairs
  bio.js                   schematic lines and card parallax
  gallery.js               3D work gallery, drag to inspect
  videos.js                monitor wall, lazy decode, live timestamps
  faq.js                   accordion plus the pinned rail
assets/fonts/              Big Shoulders Display, Bodoni Moda, Martian Mono (SIL OFL)
assets/works/              12 gallery images, 13 poster frames, 13 loop videos
assets/images/             ghost icon, QR code, contact masks
tools/make_assets.py       regenerates every file in assets/
```

## Content

Copy lives in `assets/js/data.js`. The `WORK` array drives the gallery, the
`MONITORS` array drives the camera wall, and `FAQ` drives the accordion, so all
three can be re-ordered or extended without touching markup.

## Regenerating assets

The artwork, poster frames and loop videos are generated, not photographed:

```bash
pip install pillow numpy qrcode imageio-ffmpeg
python3 tools/make_assets.py
```

The script downloads the drawing fonts into `tools/.fonts/` on first run and
writes the whole of `assets/`. Editing the drawing functions in
`tools/make_assets.py` is the way to change the visual direction of the
gallery and the monitor wall.

## Notes

- Colours are driven by `--color-*` tokens; the theme toggle swaps them and
  fires a short chromatic glitch over the transition.
- Motion respects `prefers-reduced-motion`: the loader, grain, orbit and dot
  field all settle to their resting state.
- Monitors only decode their loop while they are near the viewport, and
  everything pauses when the tab is hidden.

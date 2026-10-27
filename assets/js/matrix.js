/* Matrix rain over the hero.

   The canvas sits above the hero background but below .Hero_heroInner (z-index
   2) and .Hero_banner (z-index 10), so the headline stays readable and the rain
   shows through around it. Colours come from the design tokens, so it follows
   the active theme instead of being locked to green. */
(() => {
  'use strict';
  const { $, reduceMotion, cssRgb } = window.APP;

  const hero = $('#hero');
  const canvas = $('#matrix');
  if (!hero || !canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const GLYPHS =
    'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ' +
    '0123456789ABCDEFXYZ$+-*/=%"\'#&_(),.;:?!\\|{}<>[]^~';
  const FONT = 15;
  const LEAD = 0.86;        // rows sit closer together than one font size
  const TAIL = 11;          // glyphs in a trail

  let W = 0, H = 0, dpr = 1, cols = 0, rows = 0;
  let drops, speeds, hot;   // one entry per COLUMN, not per cell

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth;
    H = hero.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.max(1, Math.ceil(W / FONT));
    rows = Math.max(1, Math.ceil(H / (FONT * LEAD)));
    drops = new Float32Array(cols);
    speeds = new Float32Array(cols);
    hot = new Uint8Array(cols);
    for (let i = 0; i < cols; i++) {
      drops[i] = -Math.random() * rows;      // staggered so they do not sync
      speeds[i] = 0.35 + Math.random() * 0.65;
      hot[i] = Math.random() < 0.06 ? 1 : (Math.random() < 0.18 ? 2 : 0);
    }
  }

  const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

  /* A trail: bright head, bright tail, then fading glyphs behind it. */
  function trail(x, headRow, headRgb, tailRgb, alpha) {
    for (let r = headRow; r > headRow - TAIL; r--) {
      if (r < 0 || r >= rows) continue;
      const t = (headRow - r) / TAIL;
      const fade = (1 - t) * (1 - t) * alpha;
      if (fade < 0.015) continue;
      const isHead = r === headRow;
      ctx.fillStyle = isHead
        ? `rgba(${headRgb},${(0.95 * alpha).toFixed(3)})`
        : `rgba(${tailRgb},${(0.5 * fade).toFixed(3)})`;
      ctx.fillText(glyph(), x, r * FONT * LEAD);
    }
  }

  function frame() {
    // fade what is already on the canvas instead of clearing it; that residue is
    // what produces the falling-trail look
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.11)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    const accent = cssRgb('--rgb-accent-2', '34,224,200');
    const ink = cssRgb('--rgb-fg', '236,236,246');
    ctx.font = `600 ${FONT}px "Martian Mono","Courier New",monospace`;
    ctx.textBaseline = 'top';

    for (let c = 0; c < cols; c++) {
      drops[c] += speeds[c] * 0.5;
      if (drops[c] > rows + TAIL) drops[c] = -Math.random() * rows * 0.6;
      const x = c * FONT;
      trail(x, drops[c] | 0, hot[c] ? ink : accent, accent, hot[c] ? 0.55 : 0.45);
      // a second, dimmer drop on some columns so the fall is not a flat curtain
      if (hot[c] === 2) {
        const second = drops[c] - rows * 0.55;
        if (second > -TAIL) trail(x, second | 0, accent, accent, 0.3);
      }
    }
    requestAnimationFrame(frame);
  }

  ctx.font = `600 ${FONT}px "Martian Mono","Courier New",monospace`;
  ctx.textBaseline = 'top';
  resize();

  if (reduceMotion) {
    // a single static frame: present, but not moving
    const accent = cssRgb('--rgb-accent-2', '34,224,200');
    for (let c = 0; c < cols; c++) trail(c * FONT, (c * 7) % rows, accent, accent, 0.5);
    return;
  }

  requestAnimationFrame(frame);
})();

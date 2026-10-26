/* Interactive dot field with cursor displacement, plus the rotating
   Design / Code label pairs. */
(() => {
  'use strict';
  const { $, FIELD_PAIRS, reduceMotion, clamp, lerp, cssRgb } = window.APP;

  const section = $('#field');
  const canvas = $('#field-canvas');
  if (!section || !canvas) return;

  const ctx = canvas.getContext('2d');
  const labels = [$('[data-label="0"]'), $('[data-label="1"]')];
  const descs = [$('[data-desc="0"]'), $('[data-desc="1"]')];
  const dpr = Math.min(devicePixelRatio || 1, 2);

  let W = 0, H = 0, step = 34, cols = 0, rows = 0;
  let rgbA = '124,92,255', rgbB = '34,224,200';
  const pointer = { x: -1e5, y: -1e5, on: false };

  function resize() {
    W = Math.round(section.clientWidth * dpr);
    H = Math.round(section.clientHeight * dpr);
    step = Math.max(22, Math.min(section.clientWidth, section.clientHeight) / 24) * dpr;
    cols = Math.ceil(W / step) + 1;
    rows = Math.ceil(H / step) + 1;
    canvas.width = W;
    canvas.height = H;
  }
  resize();
  addEventListener('resize', resize);

  section.addEventListener('pointermove', e => {
    const r = section.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) * dpr;
    pointer.y = (e.clientY - r.top) * dpr;
    pointer.on = true;
  }, { passive: true });
  section.addEventListener('pointerleave', () => { pointer.on = false; });

  const R = () => 220 * dpr;

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    rgbA = cssRgb('--rgb-accent', '124,92,255');
    rgbB = cssRgb('--rgb-accent-2', '34,224,200');
    const t = now / 1000;
    const radius = R();
    for (let ix = 0; ix < cols; ix++) {
      for (let iy = 0; iy < rows; iy++) {
        let x = ix * step, y = iy * step, a = .16, size = 1;
        if (pointer.on) {
          const dx = x - pointer.x, dy = y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < radius) {
            const f = 1 - d / radius;
            x += (dx / (d || 1)) * f * 28 * dpr;
            y += (dy / (d || 1)) * f * 28 * dpr;
            a = .16 + f * .84;
            size = 1 + f * 1.6;
          }
        }
        const wave = Math.sin(x * .011 + t * .7) * Math.cos(y * .013 - t * .45);
        a = Math.min(1, a + Math.max(0, wave) * .26);
        size += Math.max(0, wave) * .8;
        // dots drift between the two lead accents across the grid, so the
        // field reads as a colour gradient rather than one flat tint
        const mix = clamp((ix / Math.max(1, cols - 1)) * .6 + (1 - iy / Math.max(1, rows - 1)) * .4);
        const rgb = mix > .5 ? rgbA : rgbB;
        ctx.fillStyle = `rgba(${rgb},${(a * .7).toFixed(3)})`;
        ctx.fillRect(x, y, size * dpr, size * dpr);
      }
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  // rotating label pairs
  labels.forEach(n => n && n.classList.add('is-active'));
  if (reduceMotion) return;
  let idx = 0;
  setInterval(() => {
    idx++;
    const [l0, l1, d0, d1] = FIELD_PAIRS[idx % FIELD_PAIRS.length];
    labels.forEach(n => n && n.classList.remove('is-active'));
    setTimeout(() => {
      if (labels[0]) labels[0].textContent = l0;
      if (labels[1]) labels[1].textContent = l1;
      if (descs[0]) descs[0].textContent = d0;
      if (descs[1]) descs[1].textContent = d1;
      labels.forEach(n => n && n.classList.add('is-active'));
    }, 280);
  }, 5400);
})();

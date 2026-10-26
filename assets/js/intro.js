/* Boot sequence overlay: particle star that assembles, then splits away. */
(() => {
  'use strict';
  const { $, $$, clamp, lerp, easeOut, reduceMotion, cssVar } = window.APP;

  const root = $('#intro');
  if (!root) return;

  const canvas = $('#intro-canvas');
  const logo = $('#intro-logo');
  const name = $('#intro-name');
  const percent = $('#intro-percent');
  const bars = $$('.Intro_loadingBar');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);

  // star outline used by both the canvas and the inline logo
  const POLY = [[24.5, 0], [27.8, 21.2], [49, 24.5], [27.8, 27.8], [24.5, 49],
                [21.2, 27.8], [0, 24.5], [21.2, 21.2]];

  let W = 0, H = 0, particles = [];
  // resolved once per frame-batch so a theme swap is picked up on reload
  let accent1 = '#7C5CFF', accent2 = '#22E0C8';

  function sampleStar(n) {
    const segs = [];
    let total = 0;
    for (let i = 0; i < POLY.length; i++) {
      const p = POLY[i], q = POLY[(i + 1) % POLY.length];
      const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
      segs.push({ p, q, d, acc: total });
      total += d;
    }
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * total;
      const s = segs.find(s => t <= s.acc + s.d) || segs[segs.length - 1];
      const k = (t - s.acc) / s.d;
      pts.push([lerp(s.p[0], s.q[0], k), lerp(s.p[1], s.q[1], k)]);
    }
    return pts;
  }

  function resize() {
    W = canvas.width = Math.round(innerWidth * dpr);
    H = canvas.height = Math.round(innerHeight * dpr);
    const scale = (Math.min(W, H) * .5) / 49;
    particles = sampleStar(150).map(([x, y]) => ({
      tx: W / 2 + (x - 24.5) * scale,
      ty: H / 2 + (y - 24.5) * scale,
      x: Math.random() * W,
      y: Math.random() * H,
      r: (Math.random() * 1.5 + .7) * dpr,
      hot: Math.random() < .35,
    }));
  }
  resize();
  addEventListener('resize', resize);

  let raf = 0, done = false;
  const start = performance.now();
  const DUR = reduceMotion ? 120 : 1500;

  function frame(now) {
    const t = clamp((now - start) / DUR);
    const k = easeOut(t);
    accent1 = cssVar('--color-accent', '#7C5CFF');
    accent2 = cssVar('--color-accent-2', '#22E0C8');
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = cssVar('--color-accent', '#7C5CFF');

    const burst = t >= 1 ? clamp((now - start - DUR) / 700) : 0;
    for (const p of particles) {
      if (burst > 0) {
        const dx = p.x - W / 2, dy = p.y - H / 2;
        const d = Math.hypot(dx, dy) || 1;
        p.x += (dx / d) * burst * 9 * dpr;
        p.y += (dy / d) * burst * 9 * dpr;
        ctx.globalAlpha = (1 - burst) * .8;
      } else {
        p.x = lerp(p.x, p.tx, .05 + k * .2);
        p.y = lerp(p.y, p.ty, .05 + k * .2);
        ctx.globalAlpha = .12 + k * .88;
      }
      ctx.fillStyle = p.hot ? accent2 : accent1;
      ctx.fillRect(p.x, p.y, p.r, p.r);
    }
    ctx.globalAlpha = 1;

    if (!done && t >= 1) {
      done = true;
      logo.style.opacity = '1';
      particles.forEach(p => { p.x = p.tx; p.y = p.ty; });
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  let pct = 0;
  const timer = setInterval(() => {
    pct = Math.min(100, pct + Math.random() * 17 + 7);
    percent.textContent = Math.round(pct) + '%';
    bars.forEach((b, i) => b.classList.toggle('is-on', pct > (i + 1) * 22));
    if (pct >= 100) clearInterval(timer);
  }, 95);

  let revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    clearInterval(timer);
    percent.textContent = '100%';
    bars.forEach(b => b.classList.add('is-on'));
    name.style.transition = 'opacity .5s ease';
    name.style.opacity = '1';
    logo.style.transition = 'opacity .35s ease, transform .6s cubic-bezier(.25,0,0,1)';
    logo.style.transform = 'translate(-50%,-50%) scale(.8)';
    setTimeout(() => { logo.style.opacity = '.22'; }, 380);
    setTimeout(() => {
      cancelAnimationFrame(raf);
      root.classList.add('is-done');
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-ready');
      const banner = $('#hero-banner');
      if (banner) banner.classList.add('is-open');
      setTimeout(() => root.remove(), 1200);
    }, reduceMotion ? 40 : 900);
  }

  document.body.classList.add('is-loading');
  if (reduceMotion) reveal();
  else setTimeout(reveal, 2100);
  addEventListener('keydown', e => { if (e.key === 'Escape') reveal(); }, { once: true });
  root.addEventListener('click', reveal, { once: true });
})();

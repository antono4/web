/* Chrome: custom cursor, theme glitch, nav logo, hero banner and hero grid. */
(() => {
  'use strict';
  const { $, $$, el, clamp, lerp, reduceMotion } = window.APP;

  /* ── custom cursor ───────────────────────────────────────────────────── */
  const cursor = $('#cursor-dot');
  if (cursor && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, s = 1, ts = 1;
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      ts = e.target.closest('a,button,.MyWay_obj,.VideoGrid_monitor') ? 3.2 : 1;
    }, { passive: true });
    addEventListener('pointerdown', () => { ts = .6; });
    addEventListener('pointerup', () => { ts = 1; });
    (function loop() {
      x = lerp(x, tx, .22); y = lerp(y, ty, .22); s = lerp(s, ts, .13);
      cursor.style.transform = `translate3d(${x - 6}px,${y - 6}px,0) scale(${s})`;
      requestAnimationFrame(loop);
    })();
  }

  /* ── theme toggle with chromatic glitch ──────────────────────────────── */
  const themeBtn = $('#theme-toggle');
  if (themeBtn) {
    const mask = $('#theme-mask');
    const logo = $('#theme-glitch-logo');
    const glitch = [$('#theme-glitch-r'), $('#theme-glitch-b')];
    if (localStorage.getItem('theme') === 'light') document.documentElement.dataset.theme = 'light';

    themeBtn.addEventListener('click', () => {
      const light = document.documentElement.dataset.theme !== 'light';
      if (light) document.documentElement.dataset.theme = 'light';
      else delete document.documentElement.dataset.theme;
      localStorage.setItem('theme', light ? 'light' : 'dark');
      if (reduceMotion || !mask.animate) return;

      mask.animate([{ opacity: 0 }, { opacity: .92, offset: .32 },
                    { opacity: .92, offset: .58 }, { opacity: 0 }],
                   { duration: 430, easing: 'ease-in-out', fill: 'forwards' });
      logo.animate([{ opacity: 0 }, { opacity: 1, offset: .34 }, { opacity: 0 }],
                   { duration: 540, fill: 'forwards' });
      glitch.forEach((g, i) => g && g.animate([
        { opacity: 0, transform: 'translateX(0)' },
        { opacity: .7, transform: `translateX(${i ? 12 : -12}px)`, offset: .3 },
        { opacity: .3, transform: `translateX(${i ? -8 : 8}px)`, offset: .62 },
        { opacity: 0 },
      ], { duration: 460, delay: i * 60, fill: 'forwards' }));
    });
  }

  /* ── nav logo: outline traces in on hover ────────────────────────────── */
  const navLogo = $('.Nav_logoSvg');
  const outlineWrap = $('.Nav_logoOutline');
  const outlinePath = outlineWrap && outlineWrap.querySelector('path');
  if (navLogo && outlinePath) {
    const len = outlinePath.getTotalLength();
    outlinePath.style.strokeDasharray = len;
    outlinePath.style.strokeDashoffset = len;
    outlinePath.style.transition = 'stroke-dashoffset .7s cubic-bezier(.65,0,.35,1)';
    navLogo.addEventListener('pointerenter', () => {
      outlineWrap.style.opacity = '1';
      outlinePath.style.strokeDashoffset = '0';
    });
    navLogo.addEventListener('pointerleave', () => {
      outlineWrap.style.opacity = '0';
      outlinePath.style.strokeDashoffset = len;
    });
  }

  /* ── hero: split the banner word into per-character flaps ────────────── */
  $$('.Hero_bannerWord').forEach((wordEl, w) => {
    [...(wordEl.dataset.word || '')].forEach((ch, i) => {
      const wrap = el('span', 'Hero_bannerCharWrap');
      const c = el('span', 'Hero_bannerChar', ch);
      c.style.transitionDelay = `${(w * 6 + i) * 45}ms`;
      wrap.appendChild(c);
      wordEl.appendChild(wrap);
    });
  });

  /* ── hero: binary and hex read-out strips ────────────────────────────── */
  const binEl = $('[data-bin=binary]');
  const hexEl = $('[data-bin=hex]');
  const hexChars = '0123456789ABCDEF';
  function refreshStrips() {
    if (binEl) {
      let out = '';
      for (let i = 0; i < 110; i++) out += Math.random() > .5 ? '1' : '0';
      binEl.textContent = out;
    }
    if (hexEl) {
      const parts = [];
      for (let i = 0; i < 20; i++) {
        let h = '';
        for (let j = 0; j < 4; j++) h += hexChars[(Math.random() * 16) | 0];
        parts.push('0x' + h);
      }
      hexEl.textContent = parts.join(' ');
    }
  }
  refreshStrips();
  if (!reduceMotion) setInterval(refreshStrips, 850);

  /* ── hero: perspective floor grid, stars, reticle ────────────────────── */
  const svg = $('#hero-svg');
  if (svg) {
    const NS = 'http://www.w3.org/2000/svg';
    const VW = 100, VH = 100, horizon = 63;
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    svg.setAttribute('preserveAspectRatio', 'none');

    const g = document.createElementNS(NS, 'g');
    g.setAttribute('stroke', 'var(--color-grid)');
    g.setAttribute('fill', 'none');
    g.setAttribute('stroke-width', '.12');
    g.setAttribute('vector-effect', 'non-scaling-stroke');

    for (let i = -16; i <= 16; i++) {
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', VW / 2); l.setAttribute('y1', horizon);
      l.setAttribute('x2', VW / 2 + i * 12); l.setAttribute('y2', VH + 12);
      l.setAttribute('opacity', i % 5 === 0 ? '.85' : '.35');
      g.appendChild(l);
    }
    for (let i = 0; i < 16; i++) {
      const y = horizon + Math.pow(i / 15, 2.5) * (VH - horizon + 10);
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', -25); l.setAttribute('y1', y);
      l.setAttribute('x2', 125); l.setAttribute('y2', y);
      l.setAttribute('opacity', i % 4 === 0 ? '.7' : '.28');
      g.appendChild(l);
    }
    svg.appendChild(g);

    // horizon rule + reticle
    const rule = document.createElementNS(NS, 'line');
    rule.setAttribute('x1', 0); rule.setAttribute('y1', horizon);
    rule.setAttribute('x2', VW); rule.setAttribute('y2', horizon);
    rule.setAttribute('stroke', 'var(--color-accent)');
    rule.setAttribute('stroke-width', '.15');
    rule.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(rule);

    const STAR = 'M24.5 0 27.8 21.2 49 24.5 27.8 27.8 24.5 49 21.2 27.8 0 24.5 21.2 21.2Z';
    const STAR_INKS = ['var(--color-accent)', 'var(--color-accent-2)',
                       'var(--color-accent-3)', 'var(--color-accent-4)'];
    [[7, 13, .55], [90, 20, .4], [15, 78, .32], [82, 66, .5], [45, 27, .3], [62, 88, .26]]
      .forEach(([x, y, s], i) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', STAR);
        p.setAttribute('fill', STAR_INKS[i % STAR_INKS.length]);
        p.setAttribute('transform',
          `translate(${x} ${y}) scale(${s * .18}) translate(-24.5 -24.5)`);
        p.style.animation = `twinkle ${3.2 + i * .8}s ease-in-out ${i * .45}s infinite`;
        svg.appendChild(p);
      });
  }
})();

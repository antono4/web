/* 3D work gallery: cards fly in on scroll, orbit the centre, get swallowed
   by the distorted "Selected Work" catcher. Drag any card to inspect it. */
(() => {
  'use strict';
  const { $, $$, el, clamp, lerp, easeInOut, reduceMotion, WORK } = window.APP;

  const section = $('#myway');
  const wrapper = $('#myway-wrapper');
  if (!section || !wrapper) return;

  const STAR = 'M24.5 0 27.8 21.2 49 24.5 27.8 27.8 24.5 49 21.2 27.8 0 24.5 21.2 21.2Z';
  const FRAMES = WORK.length;
  const STARS = 6;
  const items = [];

  /* ── build the scene ─────────────────────────────────────────────────── */
  WORK.forEach((w, i) => {
    const obj = el('div', 'MyWay_obj MyWay_objFrame');
    const fig = el('figure', 'MyWay_inner');
    const pic = el('picture', 'MyWay_picture');
    const img = el('img', 'MyWay_img');
    img.src = `assets/works/${w.file}.webp`;
    img.alt = `${w.title} — ${w.tag}`;
    img.loading = i < 3 ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.width = 1200; img.height = 900;
    pic.appendChild(img);
    const cap = el('figcaption', 'MyWay_caption');
    cap.innerHTML = `<span>${w.title}</span> · <span>${w.tag}</span>`;
    fig.append(pic, cap);
    const sideH = el('div', 'MyWay_sideH');
    const sideV = el('div', 'MyWay_sideV');
    obj.append(fig, sideH, sideV);
    obj.style.zIndex = String(10 + i);
    wrapper.appendChild(obj);
    items.push({ node: obj, phase: (i + .5) / FRAMES, kind: 'frame', i });
  });

  for (let j = 0; j < STARS; j++) {
    const obj = el('div', 'MyWay_obj MyWay_objStar');
    ['TL', 'TR', 'BL', 'BR'].forEach(k => {
      const s = el('div', `MyWay_side MyWay_side${k}`);
      s.innerHTML = `<svg viewBox="0 0 49 49" fill="none" stroke="currentColor"
        stroke-width="1" style="width:100%;height:100%;color:var(--color-fg2);opacity:.5">
        <path d="${STAR}"/></svg>`;
      obj.appendChild(s);
    });
    wrapper.appendChild(obj);
    items.push({ node: obj, phase: (j + .5) / STARS, kind: 'star', i: j });
  }

  /* ── decorative guides ───────────────────────────────────────────────── */
  const NS = 'http://www.w3.org/2000/svg';
  const svg = $('#myway-svg');
  function buildGuides() {
    if (!svg) return;
    const w = section.clientWidth, h = section.clientHeight;
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.textContent = '';
    const g = document.createElementNS(NS, 'g');
    const cx = w / 2;
    const pad = Math.round(h * .12);
    [[cx, 0, cx, h, '.5'], [0, h * .5, w, h * .5, '.35'],
     [cx - 26, pad, cx - 26, h - pad, '.3'], [cx + 26, pad, cx + 26, h - pad, '.3']]
      .forEach(([x1, y1, x2, y2, o]) => {
        const l = document.createElementNS(NS, 'line');
        l.setAttribute('x1', x1); l.setAttribute('y1', y1);
        l.setAttribute('x2', x2); l.setAttribute('y2', y2);
        l.setAttribute('stroke', 'var(--color-border)');
        l.setAttribute('opacity', o);
        g.appendChild(l);
      });
    for (let i = 0; i < 22; i++) {
      const y = pad + (i / 21) * (h - pad * 2);
      const t = document.createElementNS(NS, 'line');
      t.setAttribute('x1', cx - 26); t.setAttribute('y1', y);
      t.setAttribute('x2', cx - (i % 5 === 0 ? 44 : 34)); t.setAttribute('y2', y);
      t.setAttribute('stroke', 'var(--color-border)');
      t.setAttribute('opacity', i % 5 === 0 ? '.7' : '.35');
      g.appendChild(t);
    }
    svg.appendChild(g);
  }
  buildGuides();
  addEventListener('resize', buildGuides);

  /* ── motion curve: one position per phase ────────────────────────────── */
  function curve(u) {
    if (u < 0) {
      const k = clamp(-u, 0, 1);
      return { x: 0, y: 0, z: -1000 - k * 700, rx: 0, ry: 0, rz: 0, s: 0, o: 0 };
    }
    if (u <= 1) {
      const e = easeInOut(u);
      const radius = lerp(0, 46, e);
      const ang = e * Math.PI * 1.5;
      return {
        x: Math.cos(ang) * radius,
        y: Math.sin(ang) * radius * .55,
        z: lerp(-1150, 0, e),
        rx: lerp(20, 0, e),
        ry: lerp(-26, 0, e),
        rz: lerp(-11, 0, e),
        s: lerp(.26, 1, e),
        o: clamp(u / .1),
      };
    }
    const k = clamp(u - 1, 0, 1);
    const e = easeInOut(k);
    return {
      x: 0,
      y: lerp(0, 430, e),
      z: lerp(0, 150, e),
      rx: lerp(0, 22, e),
      ry: 0,
      rz: lerp(0, 12, e),
      s: lerp(1, 1.14, e),
      o: 1 - clamp((k - .22) / .78),
    };
  }

  /* ── drag ────────────────────────────────────────────────────────────── */
  let drag = null;
  items.forEach(it => {
    it.node.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = {
        it,
        id: e.pointerId,
        ox: e.clientX, oy: e.clientY,
        dx: 0, dy: 0,
      };
      it.node.classList.add('MyWay_dragging');
      it.node.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });
    it.node.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId || drag.it !== it) return;
      drag.dx = e.clientX - drag.ox;
      drag.dy = e.clientY - drag.oy;
    });
    const end = e => {
      if (!drag || drag.it !== it) return;
      it.node.classList.remove('MyWay_dragging');
      it.node.releasePointerCapture?.(drag.id);
      drag = null;
    };
    it.node.addEventListener('pointerup', end);
    it.node.addEventListener('pointercancel', end);
  });

  /* ── per-frame update ────────────────────────────────────────────────── */
  let target = 0, current = 0;
  const visible = u => u > -.45 && u < 1.75;

  function compute() {
    const rect = section.getBoundingClientRect();
    const p = clamp((innerHeight * .85 - rect.top) / (rect.height + innerHeight * .45));
    target = p;
    if (svg) svg.style.transform = `translateY(${(p - .5) * 40}px)`;
    section.style.setProperty('--scroll-progress',
      clamp((p - .5) / .5).toFixed(4));
  }

  function render(now) {
    current = lerp(current, target, .12);
    const t = current;
    const sway = now / 1000;

    items.forEach((it, n) => {
      const span = it.kind === 'frame' ? FRAMES : STARS;
      const uu = t * span - it.phase * span + it.phase;
      const q = curve(uu);
      const node = it.node;

      if (!visible(uu) && !(drag && drag.it === it)) {
        if (node.style.visibility !== 'hidden') node.style.visibility = 'hidden';
        return;
      }
      if (node.style.visibility === 'hidden') node.style.visibility = '';

      let x = q.x, y = q.y, rx = q.rx, ry = q.ry, rz = q.rz, s = q.s, o = q.o;
      if (it.kind === 'star') { o = 1; s = clamp(q.s) * .55; }
      if (reduceMotion) { rx = 0; ry = 0; rz = 0; }

      if (drag && drag.it === it) {
        x += drag.dx; y += drag.dy;
        rx += drag.dy * .06; ry += drag.dx * .06;
        s = Math.max(s, .9) * 1.02;
      } else {
        ry += Math.sin(sway * .35 + n) * 3.2;
        rz += Math.cos(sway * .28 + n * .7) * 2.4;
      }

      node.style.setProperty('--x', x.toFixed(2) + 'px');
      node.style.setProperty('--y', y.toFixed(2) + 'px');
      node.style.setProperty('--z', q.z.toFixed(2) + 'px');
      node.style.setProperty('--rx', rx.toFixed(2));
      node.style.setProperty('--ry', ry.toFixed(2));
      node.style.setProperty('--rz', rz.toFixed(2));
      node.style.setProperty('--s', s.toFixed(4));
      node.style.setProperty('--size', (it.kind === 'star' ? .5 : 1).toFixed(2));
      node.style.opacity = o.toFixed(3);
      node.style.pointerEvents = o > .5 ? 'auto' : 'none';
    });
  }

  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; compute(); });
  }, { passive: true });
  addEventListener('resize', compute);

  compute();
  (function loop(now) {
    render(now || performance.now());
    requestAnimationFrame(loop);
  })();

  /* ── keyboard access: tabbing to a card scrolls it into view ─────────── */
  wrapper.addEventListener('focusin', e => {
    const node = e.target.closest('.MyWay_obj');
    if (!node) return;
    const it = items.find(i => i.node === node);
    if (!it) return;
    const span = section.offsetHeight + innerHeight * .45;
    const rect = section.getBoundingClientRect();
    const top = scrollY + rect.top;
    scrollTo({ top: top + (it.phase - .2) * span, behavior: 'smooth' });
  });
})();

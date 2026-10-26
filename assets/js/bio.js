/* Bio: decorative schematic lines and a light scroll parallax on the card. */
(() => {
  'use strict';
  const { $, clamp, reduceMotion } = window.APP;

  const section = $('#about');
  const inner = $('#bio-inner');
  const svg = $('#bio-svg');
  if (!section || !inner || !svg) return;

  const NS = 'http://www.w3.org/2000/svg';

  function build() {
    const w = section.clientWidth, h = section.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.textContent = '';

    const path = document.createElementNS(NS, 'path');
    path.setAttribute('class', 'Bio_svgPath');
    const cx = w / 2, cardW = Math.min(w * .78, 672);
    const left = cx - cardW / 2, right = cx + cardW / 2;
    const top = h * .5 - inner.offsetHeight / 2;
    const bottom = top + inner.offsetHeight;
    path.setAttribute('d', [
      `M0 ${top} H${left}`,
      `M${right} ${top} H${w}`,
      `M0 ${bottom} H${left}`,
      `M${right} ${bottom} H${w}`,
      `M${left - 34} 0 V${h}`,
      `M${right + 34} 0 V${h}`,
    ].join(' '));
    svg.appendChild(path);

    // corner ticks at the four ends of the card
    [[left, top], [right, top], [left, bottom], [right, bottom]].forEach(([x, y]) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 3.2);
      c.setAttribute('fill', 'none');
      c.setAttribute('stroke', 'var(--color-border)');
      svg.appendChild(c);
    });
  }
  build();
  addEventListener('resize', build);
  addEventListener('load', build);

  if (reduceMotion) return;
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const r = section.getBoundingClientRect();
      const p = clamp((innerHeight - r.top) / (innerHeight + r.height));
      inner.style.setProperty('--offset-y', `${(p - .5) * -90}px`);
    });
  }, { passive: true });
})();

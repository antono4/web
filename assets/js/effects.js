/* Scroll effects: reveal on enter, a progress rule and a section index.

   These are additive. Nothing here reads or writes the scroll maths that the
   gallery, FAQ or contact pinning depend on, and the reveal uses the standalone
   `translate` property rather than `transform`, so it composes with the
   transforms those modules already animate instead of overwriting them. */
(() => {
  'use strict';
  const { $, $$, reduceMotion } = window.APP;

  /* ── reveal ───────────────────────────────────────────────────────────── */
  const revealTargets = $$('[data-reveal]');
  let revealPassed = null;
  if (reduceMotion) {
    revealTargets.forEach(n => n.classList.add('is-in'));
  } else {
    // stagger siblings so a group arrives as a sequence, not all at once
    const groups = new Map();
    revealTargets.forEach(n => {
      const key = n.parentElement;
      const i = groups.get(key) || 0;
      groups.set(key, i + 1);
      n.style.setProperty('--reveal-delay', `${Math.min(i, 5) * 70}ms`);
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: .12 });

    // A jump — an anchor click, a reload part-way down, or a fast flick —
    // can carry the viewport past an element without it ever intersecting,
    // which would leave it at opacity 0 for good. Anything already above the
    // fold is revealed outright.
    revealPassed = () => {
      revealTargets.forEach(n => {
        if (n.classList.contains('is-in')) return;
        if (n.getBoundingClientRect().bottom < 0) {
          n.classList.add('is-in');
          io.unobserve(n);
        }
      });
    };

    // hold everything back until the loader hands over, so the first screen
    // does not animate behind the intro overlay
    const start = () => { revealTargets.forEach(n => io.observe(n)); revealPassed(); };
    if (document.body.classList.contains('is-ready')) start();
    else {
      const mo = new MutationObserver(() => {
        if (!document.body.classList.contains('is-ready')) return;
        mo.disconnect();
        start();
      });
      mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      // if the intro never finishes, reveal anyway rather than leaving the
      // page blank
      setTimeout(() => { mo.disconnect(); start(); }, 6000);
    }
  }

  /* ── progress rule ────────────────────────────────────────────────────── */
  const bar = $('#scroll-progress');
  const index = $('#section-index');
  const SECTIONS = [
    ['hero', 'Hero'], ['field', 'Field'], ['about', 'About'], ['myway', 'Work'],
    ['videos', 'Feeds'], ['faq', 'FAQ'], ['contact', 'Contact'],
  ].map(([id, label]) => ({ id, label, el: document.getElementById(id) }))
   .filter(s => s.el);

  let links = [];
  if (index) {
    SECTIONS.forEach(s => {
      const a = document.createElement('a');
      a.className = 'SectionIndex_link';
      a.href = `#${s.id}`;
      a.innerHTML = `<span class="SectionIndex_label">${s.label}</span>` +
                    '<span class="SectionIndex_dot" aria-hidden="true"></span>';
      index.appendChild(a);
      links.push(a);
    });
    index.setAttribute('aria-label', 'Section index');
  }

  let ticking = false;
  function update() {
    ticking = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    if (bar) bar.style.transform = `scaleX(${p})`;

    if (!links.length) return;
    // the section whose middle is nearest the middle of the viewport wins;
    // this keeps working for the pinned FAQ and contact stages
    const mid = scrollY + innerHeight / 2;
    let best = 0, bestD = Infinity;
    SECTIONS.forEach((s, i) => {
      const top = s.el.offsetTop;
      const d = Math.abs(top + s.el.offsetHeight / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    links.forEach((a, i) => a.classList.toggle('is-active', i === best));
  }

  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); if (revealPassed) revealPassed(); });
  }, { passive: true });
  addEventListener('resize', update);
  update();
})();

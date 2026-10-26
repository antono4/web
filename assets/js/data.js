/* Shared helpers and site content. Exposed on window.APP. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const WORK = [
    { file: 'work-01', title: 'Branding', tag: 'Mark system' },
    { file: 'work-02', title: 'UI Design', tag: 'Component kit' },
    { file: 'work-03', title: 'Landing Page', tag: 'Conversion' },
    { file: 'work-04', title: 'Korus — SaaS', tag: 'Product' },
    { file: 'work-05', title: 'SBE Hub', tag: 'Dashboard' },
    { file: 'work-06', title: 'Motion', tag: 'Reel' },
    { file: 'work-07', title: 'Glassmorphism', tag: 'Visual' },
    { file: 'work-08', title: 'Dashboard', tag: 'Analytics' },
    { file: 'work-09', title: 'Identity', tag: 'Logotype' },
    { file: 'work-10', title: 'Typography', tag: 'Specimen' },
    { file: 'work-11', title: 'Design', tag: 'Tokens' },
    { file: 'work-12', title: 'Design & Code', tag: 'WebGL' },
  ];

  const MONITORS = [
    { cam: 'CAM-01', label: 'Session 01', file: 'rec-01' },
    { cam: 'CAM-02', label: 'Session 02', file: 'rec-02' },
    { cam: 'CAM-03', label: 'Session 03', file: 'rec-03' },
    { cam: 'CAM-04', label: 'Session 06', file: 'rec-04' },
    { cam: 'CAM-05', label: 'Session 04', file: 'rec-05' },
    { cam: 'CAM-06', label: 'Session 05', file: 'rec-06' },
    { cam: 'CAM-07', label: 'Hero Design', file: 'hero-reel' },
    { cam: 'CAM-08', label: 'Session 07', file: 'rec-08' },
    { cam: 'CAM-09', label: 'Session 08', file: 'rec-09' },
    { cam: 'CAM-10', label: 'Session 09', file: 'rec-10' },
    { cam: 'CAM-11', label: 'Claude Motion', file: 'claude-motion-reel' },
    { cam: 'CAM-12', label: 'Motion Reel', file: 'motion-reel' },
    { cam: 'CAM-13', label: 'Screen Capture', file: 'screen-rec' },
  ];

  const FAQ = [
    ['What kind of projects?',
      'Websites, SaaS products, landing pages and design systems. Anything that needs strong visual direction and clean implementation at the same time — never one without the other.'],
    ['How does the collab work?',
      'Async first. You get regular written updates and a live preview link at every step, so you always know where the project stands without a meeting that drags on.'],
    ['Your stack?',
      'Next.js, React, TypeScript, GSAP and a canvas or WebGL layer when the idea needs it. I choose based on the project, not the other way around.'],
    ['Timeline?',
      'A landing page is roughly a week. A full product runs four to twelve weeks. You get a clear plan with dates before we start.'],
    ['Available?',
      'Yes, I am taking new projects now. Send a message or book a fifteen minute call and we scope it in one conversation.'],
    ['Solo or team?',
      'Solo on nearly everything — no validation layers, no noise. On larger builds I bring in a small set of people I have worked with before.'],
    ['Design or dev?',
      'Both. I design and I build, so nothing is lost in the handoff between mockup and final result.'],
    ['NDA?',
      'Yes, no problem. If the project calls for it we sign before the first line of code.'],
    ['First contact?',
      'A message or a fifteen minute call. We scope the work together and you get a written proposal within forty eight hours.'],
  ];

  const FIELD_PAIRS = [
    ['Interface', 'Motion',
      'Layout, typography and rhythm — the structure you feel before you read a single word.',
      'Scroll, hover and transition work that stays smooth on a low-end phone.'],
    ['Layout', 'Logic',
      'Grids that hold at every breakpoint, spacing that survives a content change.',
      'Typed data and predictable state, with no effect firing twice because nobody checked.'],
    ['Visual', 'Systems',
      'Colour, weight and contrast chosen as a system rather than per screen.',
      'Tokens, components and tests, so the tenth screen costs less than the first.'],
  ];

  window.APP = {
    $, $$,
    clamp: (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    easeOut: t => 1 - Math.pow(1 - t, 3),
    easeInOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    // read a design token so canvas drawing follows the active theme
    cssVar(name, fallback = '') {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    },
    // standalone, so it survives being destructured off APP
    cssRgb(name, fallback = '236,236,246') {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    },
    el(tag, cls, html) {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (html != null) n.innerHTML = html;
      return n;
    },
    WORK, MONITORS, FAQ, FIELD_PAIRS,
  };
})();

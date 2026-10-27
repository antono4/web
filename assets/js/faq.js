/* FAQ accordion plus the pinned rail.

   The rail travels through a sticky stage. Two things used to go wrong:

   1. The rail was taller than the stage on anything under ~900px tall, and the
      stage does not scroll, so the top and bottom items were clipped and could
      not be reached.
   2. The travel range did not account for the rail's own height, so at the ends
      of the scroll the first and last rows slid out of the stage even when the
      rail did fit.

   The range is now computed so the rail's top edge never rises above the stage
   and its bottom edge never drops below it. When the rail is taller than the
   stage it can never fit, so the stage is grown instead: it is pinned at the top
   while the rail is taller than the viewport, then the rest of the section
   scrolls normally and every row can be reached. */
(() => {
  'use strict';
  const { $, $$, el, clamp, lerp, FAQ } = window.APP;

  const list = $('#faq-list');
  const rail = $('#faq-rail');
  const section = $('#faq');
  const stage = $('.Faq_stage');
  const titleWrap = $('.Faq_titleWrap');
  if (!list || !rail || !section || !stage) return;

  /* ── build the items ─────────────────────────────────────────────────── */
  FAQ.forEach(([q, a], i) => {
    const item = el('div', 'Faq_item');
    const btn = el('button', 'Faq_trigger');
    const qid = `faq-trigger-${i}`;
    const aid = `faq-answer-${i}`;
    btn.type = 'button';
    btn.id = qid;                       // the answer points back at this
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', aid);
    btn.innerHTML = `
      <span class="Faq_num">0${i + 1}</span>
      <span class="Faq_question">${q}</span>
      <span class="Faq_icoWrap" aria-hidden="true">
        <svg class="Faq_icoHor" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2">
          <line x1="0" y1="10" x2="20" y2="10"/>
        </svg>
        <svg class="Faq_icoVer" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2">
          <line x1="10" y1="0" x2="10" y2="20"/>
        </svg>
      </span>`;
    const wrap = el('div', 'Faq_answerWrap');
    wrap.id = aid;
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-labelledby', qid);
    const inner = el('div', 'Faq_answerInner');
    inner.appendChild(el('div', 'Faq_answerGutter', ''));
    inner.appendChild(el('p', 'Faq_answerText', a));
    wrap.appendChild(inner);
    item.append(btn, wrap);
    list.appendChild(item);

    btn.addEventListener('click', () => {
      const open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      if (open) {
        // one answer at a time keeps the rail short enough to stay on screen
        $$('.Faq_item.is-open', list).forEach(other => {
          if (other === item) return;
          other.classList.remove('is-open');
          $('.Faq_trigger', other).setAttribute('aria-expanded', 'false');
        });
      }
      layout();
    });
  });

  /* ── geometry ────────────────────────────────────────────────────────── */
  let target = 0, current = 0;

  // the stage keeps its height with border-box, so the band left for the rail is
  // the content box, not the full stage
  function availH() {
    const cs = getComputedStyle(stage);
    return stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  }

  function sizeSection() {
    // measure with the rail unshifted, or offsetHeight reads a stale value
    const prev = rail.style.transform;
    rail.style.transform = 'translateX(-50%)';
    const railH = rail.offsetHeight;
    rail.style.transform = prev;

    // When the rail cannot fit, a pinned stage would hold its lower half
    // off-screen forever, because a sticky element taller than the viewport never
    // reveals its own bottom. Fall back to normal flow: the rail scrolls with the
    // page, so every row is reachable and nothing is cut off.
    //
    // The test has to be against the viewport, not against the stage height: a
    // sticky stage can never show more than the viewport, and comparing with the
    // stage's own height would feed back on the height set two lines below, so
    // the flag flipped on every pass.
    const cs = getComputedStyle(stage);
    const maxBand = innerHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const tall = railH > maxBand;
    section.classList.toggle('Faq_isTall', tall);
    if (tall) {
      stage.style.height = 'auto';
      section.style.height = '';
      // render() writes the pan offset inline, and an inline transform beats the
      // stylesheet. Left in place it pushes the first rows above the section in
      // static mode, where they can no longer be scrolled to.
      rail.style.removeProperty('transform');
    } else {
      stage.style.height = '';
      section.style.height = `${Math.round(stage.offsetHeight + innerHeight * 1.15)}px`;
    }
    layout();
  }

  function layout() {
    const rect = section.getBoundingClientRect();
    const span = Math.max(1, section.offsetHeight - stage.offsetHeight);
    target = clamp(-rect.top / span);
    if (titleWrap) titleWrap.style.opacity = String(clamp(target * 3.4) * clamp((1 - target) * 3.4));
  }

  function render() {
    current = lerp(current, target, .16);
    if (section.classList.contains('Faq_isTall')) {
      rail.style.visibility = 'visible';
      requestAnimationFrame(render);
      return;
    }
    const railH = rail.offsetHeight;
    const band = availH();
    const y0 = band - railH;            // rail bottom at the stage bottom
    const y1 = Math.min(0, y0);         // rail top at the stage top
    rail.style.transform = `translateX(-50%) translateY(${lerp(y0, y1, current).toFixed(2)}px)`;
    rail.style.visibility = 'visible';
    requestAnimationFrame(render);
  }

  addEventListener('resize', sizeSection);
  addEventListener('scroll', layout, { passive: true });
  // an open answer changes the rail height, so re-measure after the row animates
  list.addEventListener('click', () => setTimeout(sizeSection, 1200));

  // fonts change the rail height, so settle once they are ready
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeSection);
  requestAnimationFrame(() => { sizeSection(); render(); });
})();

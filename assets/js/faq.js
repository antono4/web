/* FAQ accordion plus the sticky rail pinning used by both FAQ and contact. */
(() => {
  'use strict';
  const { $, $$, el, clamp, lerp, FAQ } = window.APP;

  const list = $('#faq-list');
  const rail = $('#faq-rail');
  const section = $('#faq');
  if (!list || !rail || !section) return;

  FAQ.forEach(([q, a], i) => {
    const item = el('div', 'Faq_item');
    const btn = el('button', 'Faq_trigger');
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', `faq-answer-${i}`);
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
    wrap.id = `faq-answer-${i}`;
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-labelledby', `faq-trigger-${i}`);
    const inner = el('div', 'Faq_answerInner');
    inner.appendChild(el('p', 'Faq_answerText', a));
    wrap.appendChild(inner);
    item.append(btn, wrap);
    list.appendChild(item);

    btn.addEventListener('click', () => {
      const open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      if (open) {
        // close the others: one answer at a time keeps the rail readable
        $$('.Faq_item.is-open', list).forEach(other => {
          if (other === item) return;
          other.classList.remove('is-open');
          $('.Faq_trigger', other).setAttribute('aria-expanded', 'false');
        });
      }
      layout(true);
    });
  });

  /* The rail is pinned in a sticky stage and panned vertically by scroll
     progress, so the list drifts through the centred F / Q title. */
  const stage = $('.Faq_stage');
  const titleWrap = $('.Faq_titleWrap');
  let target = 0, current = 0;

  function layout() {
    const rect = section.getBoundingClientRect();
    const span = Math.max(1, section.offsetHeight - stage.offsetHeight);
    target = clamp(-rect.top / span);
    if (titleWrap) titleWrap.style.opacity = String(clamp(target * 3.4) * clamp((1 - target) * 3.4));
  }

  function render() {
    current = lerp(current, target, .16);
    const railH = rail.offsetHeight;
    const stageH = stage.offsetHeight;
    // travel from just below the fold to just above it, centred on the stage
    const from = stageH * .5 + railH * .5;
    const to = stageH * .5 - railH * .5;
    rail.style.transform = `translateX(-50%) translateY(${lerp(from, to, current).toFixed(2)}px)`;
    rail.style.visibility = 'visible';
    requestAnimationFrame(render);
  }

  function sizeSection() {
    // enough room for the rail to travel through the whole stage
    section.style.height = `${Math.round(innerHeight * 2.15)}px`;
    layout();
  }

  addEventListener('resize', sizeSection);
  addEventListener('scroll', layout, { passive: true });

  // fonts change the rail height, so settle once they are ready
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeSection);
  requestAnimationFrame(() => { sizeSection(); render(); });
})();

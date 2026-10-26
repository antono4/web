/* Surveillance wall: 13 monitors that play a loop only while on screen. */
(() => {
  'use strict';
  const { $, el, MONITORS, reduceMotion } = window.APP;

  const grid = $('#video-grid');
  const status = $('#feeds-status');
  if (!grid) return;

  // Row composition mirrors a real camera wall: 4 / 4 / 5
  const ROWS = [MONITORS.slice(0, 4), MONITORS.slice(4, 8), MONITORS.slice(8, 13)];
  const RATIO = { 4: 4 / 3, 5: 16 / 10 };

  const monitors = [];
  let online = 0;

  ROWS.forEach((row, r) => {
    const rowEl = el('div', 'VideoGrid_row');
    rowEl.dataset.row = String(r);
    row.forEach((m, c) => {
      const node = el('div', 'VideoGrid_monitor');
      node.style.setProperty('--ratio', RATIO[row.length].toFixed(4));
      node.style.setProperty('--cam', String(m.cam));
      node.dataset.cam = m.cam;

      const screen = el('div', 'VideoGrid_screen');
      const video = el('video', 'VideoGrid_media');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';
      video.poster = `assets/works/${m.file}-poster.jpg`;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('aria-label', `${m.cam} — ${m.label}`);

      const noSignal = el('div', 'VideoGrid_noSignal',
        `NO SIGNAL<span class="VideoGrid_noSignalSub">${m.cam} · CHECKING</span>`);

      const scan = el('div', 'VideoGrid_scanlines');
      const hud = el('div', 'VideoGrid_hud');
      const hudTop = el('div', 'VideoGrid_hudTop');
      const recBadge = el('span', 'VideoGrid_rec', '<span class="VideoGrid_recDot">●</span>&nbsp;REC');
      const camId = el('span', 'VideoGrid_camId', m.cam);
      hudTop.append(recBadge, camId);
      const hudBottom = el('div', 'VideoGrid_hudBottom');
      const ts = el('span', 'VideoGrid_ts');
      const camLabel = el('span', 'VideoGrid_camLabel', m.label);
      hudBottom.append(ts, camLabel);
      hud.append(hudTop, hudBottom);

      screen.append(video, noSignal, scan, hud);

      const bezel = el('div', 'VideoGrid_bezel');
      const bezelId = el('span', 'VideoGrid_bezelId', m.cam);
      const led = el('span', 'VideoGrid_led');
      const bezelLabel = el('span', 'VideoGrid_bezelLabel', m.label);
      bezel.append(bezelId, led, bezelLabel);

      node.append(screen, bezel);
      rowEl.appendChild(node);

      const state = {
        node, video, ts, led,
        cam: m.cam, file: m.file,
        online: false, loading: false,
        seed: 0,
        base: 0,
      };
      monitors.push(state);

      video.addEventListener('loadeddata', () => {
        state.online = true;
        online++;
        node.classList.remove('is-offline');
        video.play().catch(() => {});
        if (status) status.textContent = `// ${online} / ${MONITORS.length} FEEDS ONLINE`;
      });
      video.addEventListener('error', () => {
        state.online = false;
        node.classList.add('is-offline');
      });
      // a monitor never gets a source it cannot play: attach lazily
      video.addEventListener('canplay', () => { state.loading = false; });
    });
    grid.appendChild(rowEl);
  });

  /* timestamps tick in real time, offset per camera like a real DVR */
  function pad(n) { return String(n).padStart(2, '0'); }
  setInterval(() => {
    const d = new Date();
    monitors.forEach(m => {
      const off = (m.seed % 9);
      const s = (d.getSeconds() + off) % 60;
      const ms = Math.floor(d.getMilliseconds() / 10);
      m.ts.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(s)}.${pad(ms)}`;
    });
  }, 100);

  /* only decode the loops that are actually on screen */
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const m = monitors.find(x => x.node === entry.target);
      if (!m) return;
      if (entry.isIntersecting) {
        if (!m.video.src && !m.loading) {
          m.loading = true;
          m.video.src = `assets/works/${m.file}.mp4`;
          m.video.load();
        } else if (m.video.paused) {
          m.video.play().catch(() => {});
        }
      } else if (!m.video.paused) {
        m.video.pause();
      }
    });
  }, { rootMargin: '200px 0px', threshold: .01 });

  monitors.forEach((m, i) => {
    m.seed = (i * 7 + 3) % 60;
    io.observe(m.node);
  });

  /* pause everything when the tab is hidden */
  document.addEventListener('visibilitychange', () => {
    monitors.forEach(m => {
      if (document.hidden) m.video.pause();
      else if (m.online) m.video.play().catch(() => {});
    });
  });

  /* click a monitor to focus it: the others dim and shrink */
  let focused = null;
  grid.addEventListener('click', e => {
    const node = e.target.closest('.VideoGrid_monitor');
    if (!node) return;
    if (focused === node) {
      focused = null;
      grid.classList.remove('is-focused');
      monitors.forEach(m => { m.node.style.opacity = ''; });
      return;
    }
    focused = node;
    grid.classList.add('is-focused');
    monitors.forEach(m => {
      m.node.style.opacity = m.node === node ? '1' : '.35';
    });
  });
  void reduceMotion;
})();

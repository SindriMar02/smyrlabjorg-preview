/* Hótel Smyrlabjörg prototype: the room choice that follows the Holt ring, the SNDR Bókun range calendar
   mounted inline at the bottom (fixture quote states only, nothing is sent anywhere) and the ambient film. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ISK = n => 'ISK ' + n.toLocaleString('en-GB');
  /* Rates are prototype examples, labelled as such, never a live quote. Guest limits follow the rooms' own descriptions. */
  const RATES = { lux: 34000, twin: 28500, triple: 36500, family: 42000 };
  const CAP = { lux: 2, twin: 2, triple: 3, family: 5 };
  const NAME = { lux: 'Luxury double', twin: 'Twin room', triple: 'Triple room', family: 'Family room' };

  const root = $('#inline-booking'), result = $('#stay-result');
  if (root && window.mountBooking) {
    const form = $('form', root);
    let room = 'lux', dates = [], cap = CAP.lux;
    const engine = window.mountBooking(root, { min: 1, max: CAP.lux, guests: 2, months: 18, lang: 'en', taken: () => false });
    engine.prepare();
    const say = (state, html) => { result.dataset.state = state; result.innerHTML = html; };
    const reset = () => { if (result.dataset.state !== 'idle') say('idle', ''); };
    const radio = r => $(`input[name=room][value="${r}"]`, root);
    // the room tiles carry only the name; the one line of detail for the chosen room sits under them
    const detail = $('#stay-detail', root);
    const showDetail = () => { const el = radio(room), i = el && el.nextElementSibling && el.nextElementSibling.querySelector('i'); if (detail && i) detail.textContent = i.textContent; };
    showDetail();
    const setRoom = r => {
      if (!NAME[r]) return;
      room = r; const el = radio(r); if (el) el.checked = true;
      showDetail();
      if (CAP[r] !== cap) { cap = CAP[r]; dates = []; engine.setHouse(cap, () => false); }
      reset();
    };
    $$('input[name=room]', root).forEach(i => i.addEventListener('change', () => setRoom(i.value)));
    // the engine owns the selection; mirror it the way the live sites do, from the day buttons
    root.addEventListener('click', e => {
      const day = e.target.closest('.bk-d:not(:disabled)');
      if (day) { const k = day.dataset.d; dates = (!dates.length || dates.length === 2 || k <= dates[0]) ? [k] : [dates[0], k]; }
      if (e.target.closest('.bk-d, .bk-minus, .bk-plus')) reset();
    });
    let timer = 0;
    root.addEventListener('submit', e => {         // ancestor capture: runs before the engine's own submit handler on the form
      if (dates.length !== 2) return;            // the engine says what is missing
      e.preventDefault(); e.stopPropagation();
      clearTimeout(timer);
      const a = new Date(dates[0] + 'T12:00'), b = new Date(dates[1] + 'T12:00');
      const nights = Math.round((b - a) / 864e5), guests = parseInt($('.bk-n', root).textContent, 10) || 2;
      say('checking', '<p class="stay__msg">Checking the dates…</p>'); result.setAttribute('aria-busy', 'true');
      timer = setTimeout(() => {
        result.removeAttribute('aria-busy');
        let blocked = false;                      // fixture: Christmas is "sold out", everything else is open
        for (let d = new Date(a); d < b; d.setDate(d.getDate() + 1)) { if (d.getMonth() === 11 && d.getDate() >= 24 && d.getDate() <= 26) blocked = true; }
        if (blocked) { say('unavailable', `<p class="stay__msg">The ${NAME[room].toLowerCase()} is not free on those nights. Try other dates, another kind of room, or call <a href="tel:+3544781074">+354 478 1074</a>.</p>`); return; }
        say('available', `<p class="stay__msg"><b>${NAME[room]}</b>, ${nights} night${nights > 1 ? 's' : ''}, ${guests} guest${guests > 1 ? 's' : ''}</p>
          <p class="stay__total">${ISK(RATES[room] * nights)}</p>
          <p class="stay__fine text-small">Example rate, ${ISK(RATES[room])} a night. Prototype: the live site hands these dates to the hotel’s own booking system. Nothing is sent from this page.</p>`);
      }, reduced ? 0 : 650);
    }, true);
    // a room page's Book link arrives as index.html?room=twin#stay
    const asked = new URLSearchParams(location.search).get('room'); if (asked) setRoom(asked);
    // the ring, the phone list and the dock send the visitor here with a room in mind
    window.__smyRoom = r => { setRoom(r); const go = $('.header__book'); if (go) go.click(); const t = $('.stay__title'); if (t) setTimeout(() => t.focus({ preventScroll: true }), 900); };
    document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[data-room]'); if (a) { setRoom(a.dataset.room); const t = $('.stay__title'); if (t) setTimeout(() => t.focus({ preventScroll: true }), 900); } }, true);
  }

  /* ---------- the film: plays only on screen, never with reduced motion, with a pause control ---------- */
  const v = $('.l-place__video'), pauseBtn = $('.l-place__pause');
  let userPaused = false;
  if (pauseBtn) {
    if (reduced) pauseBtn.hidden = true;
    pauseBtn.addEventListener('click', () => {
      userPaused = !userPaused; pauseBtn.setAttribute('aria-pressed', String(userPaused));
      pauseBtn.setAttribute('aria-label', userPaused ? 'Play the film' : 'Pause the film'); pauseBtn.firstElementChild.textContent = userPaused ? 'Play' : 'Pause';
      userPaused ? v.pause() : v.play().catch(() => {});
    });
  }
  if (v && !reduced && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(en => { (en.isIntersecting && !userPaused) ? v.play().catch(() => {}) : v.pause(); }), { threshold: .25 }).observe(v);
    document.addEventListener('visibilitychange', () => { if (document.hidden) v.pause(); });
  }
})();

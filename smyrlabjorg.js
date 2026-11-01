/* Hótel Smyrlabjörg prototype: the stay picker (the SNDR Bókun calendar as on Aurora Hills; fixture availability and quotes,
   nothing is sent anywhere) and the ambient film. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ISK = n => 'ISK ' + n.toLocaleString('en-GB');
  /* Rates are prototype examples, labelled as such, never a live quote. Guest limits follow the rooms' own descriptions. */
  const RATES = { lux: 34000, twin: 28500, triple: 36500, family: 42000 };
  const CAP = { lux: 2, twin: 2, triple: 3, family: 5 };
  const NAME = { lux: 'Luxury double', twin: 'Twin room', triple: 'Triple room', family: 'Family room' };

  /* ---------- the stay picker: the SNDR Bókun calendar as it runs on Aurora Hills ----------
     Room tabs, two months with a centred title, a range that previews under the pointer, struck nights, check in / check out,
     guests and an example total. Availability and prices are prototype fixtures; nothing is sent anywhere. */
  const root = $('#inline-booking');
  if (root) {
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], INITIALS = ['M','T','W','T','F','S','S'];
    const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const parse = k => { const [y, m, dd] = k.split('-').map(Number); return new Date(y, m - 1, dd); };
    const nightsBetween = (a, b) => Math.round((b - a) / 864e5);
    const long = d => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    const short = d => `${DAYS[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
    const plural = n => `${n} night${n === 1 ? '' : 's'}`;
    const wide = matchMedia('(min-width: 620px)');

    const today = startOfDay(new Date());
    const lastMonth = new Date(today.getFullYear(), today.getMonth() + 17, 1);
    const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();
    let month = new Date(today.getFullYear(), today.getMonth() + (daysLeft < 7 ? 1 : 0), 1);
    let room = 'lux', start = null, end = null, hover = null, guests = 2;

    /* A taken night is a seeded run every eleven days, the same every visit, plus Christmas for every room. */
    const hash = (a, b) => { let h = 2166136261; for (const c of a + ':' + b) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h >>> 0); };
    const blocked = d => {
      if (d.getMonth() === 11 && d.getDate() >= 24 && d.getDate() <= 26) return true;
      const n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5), slot = Math.floor(n / 11), h = hash(room, slot);
      if (h % 3) return false;
      const from = slot * 11 + (h >> 3) % 8, len = 2 + (h >> 6) % 4;
      return n >= from && n < from + len;
    };

    const $$r = s => $$(s, root);
    const grids = $('.sp__grids', root), monthsEl = $('.sp__months', root), noteEl = $('.sp__note', root);

    const draw = () => {
      const n = wide.matches ? 2 : 1, shown = [];
      let html = '';
      for (let m = 0; m < n; m++) {
        const first = new Date(month.getFullYear(), month.getMonth() + m, 1); shown.push(first);
        const lead = (first.getDay() + 6) % 7;
        html += `<div class="sp__grid"><div class="sp__dows" aria-hidden="true">${INITIALS.map(w => `<span>${w}</span>`).join('')}</div><div class="sp__days" role="group" aria-label="${MONTHS[first.getMonth()]} ${first.getFullYear()}">`;
        for (let i = 0; i < 42; i++) {
          const d = addDays(first, i - lead);
          if (d.getMonth() !== first.getMonth()) { html += '<span class="sp-day sp-day--out" aria-hidden="true"></span>'; continue; }
          const k = key(d), past = d < today;
          html += `<button type="button" class="sp-day" data-d="${k}"${past ? ' disabled tabindex="-1"' : ''}><span class="sp-day__n">${d.getDate()}</span></button>`;
        }
        html += '</div></div>';
      }
      grids.innerHTML = html;
      monthsEl.innerHTML = shown.map((m, i) => i ? `<span class="sp__month2">&nbsp;·&nbsp;${MONTHS[m.getMonth()]} ${m.getFullYear()}</span>` : `${MONTHS[m.getMonth()]} ${m.getFullYear()}`).join('');
      $('[data-nav="-1"]', root).disabled = month <= new Date(today.getFullYear(), today.getMonth(), 1);
      $('[data-nav="1"]', root).disabled = new Date(month.getFullYear(), month.getMonth() + n - 1, 1) >= lastMonth;
      paint();
    };

    const rangeEnd = () => end || (start && hover && hover > start ? hover : null);
    function paint() {
      const to = rangeEnd();
      grids.toggleAttribute('data-range', !!to);
      $$('.sp-day[data-d]', grids).forEach(b => {
        const d = parse(b.dataset.d), isB = blocked(d), isStart = start && key(start) === b.dataset.d, isEnd = end && key(end) === b.dataset.d;
        b.classList.toggle('sp-day--taken', isB && d >= today);
        b.classList.toggle('sp-day--start', !!isStart);
        b.classList.toggle('sp-day--end', !!isEnd);
        b.classList.toggle('sp-day--mid', !!(start && to && d > start && d < to));
        b.classList.toggle('sp-day--today', key(today) === b.dataset.d);
        b.setAttribute('aria-label', long(d) + (isB ? ', unavailable' : '') + (isStart ? ', check in' : '') + (isEnd ? ', check out' : ''));
        if (isStart || isEnd) b.setAttribute('aria-pressed', 'true'); else b.removeAttribute('aria-pressed');
      });
    }

    const note = text => { noteEl.hidden = !text; noteEl.textContent = text || ''; };
    const reads = () => {
      const cap = parseInt($(`.sp__tab[data-room="${room}"]`, root).dataset.cap, 10);
      const cell = (n, d, empty) => { const c = $(`[data-cell="${n}"]`, root); c.toggleAttribute('data-filled', !!d); $('.sp__cell-v', c).textContent = d ? short(d) : empty; };
      cell('in', start, 'Pick a date'); cell('out', end, start ? 'Pick a date' : 'After check in');
      $('.sp__clear', root).hidden = !start;
      $('.sp__g', root).innerHTML = `${guests}<span class="sp__of"> of ${cap}</span>`;
      $('[data-g="-1"]', root).disabled = guests <= 1; $('[data-g="1"]', root).disabled = guests >= cap;
      const n = start && end ? nightsBetween(start, end) : 0, sum = $('.sp__sum', root), cta = $('.sp__cta', root);
      sum.innerHTML = n
        ? `<p class="sp__line"><span>${plural(n)} at an example rate</span><span>${ISK(RATES[room] * n)}</span></p><p class="sp__total"><span class="sp__total-l">Total</span><span class="sp__total-v">${ISK(RATES[room] * n)}</span></p>`
        : `<p class="sp__total"><span class="sp__total-l">Your stay</span><span class="sp__total-v">${NAME[room]}</span></p><p class="sp__empty">Choose your dates to see an example total.</p>`;
      cta.textContent = n ? `Book ${plural(n)} →` : 'Pick your dates';
      cta.setAttribute('aria-disabled', n ? 'false' : 'true');
    };
    $$r('.sp__tab').forEach(t => { t.dataset.cap = CAP[t.dataset.room]; });

    function pick(day) {
      if (day < today) return;
      const same = d => d && key(d) === key(day);
      if (end && same(end)) { end = null; note(''); return; }
      if (same(start)) { start = end = hover = null; note(''); return; }
      if (!start || end || day <= start) {
        if (blocked(day)) { note(`${long(day)} is not available.`); return; }
        start = day; end = null; note(''); return;
      }
      const n = nightsBetween(start, day);
      for (let i = 0; i < n; i++) if (blocked(addDays(start, i))) { note('Those dates include a night that is already taken. Choose other dates.'); return; }
      end = day; note('');
    }

    function setRoom(r) {
      if (!NAME[r]) return;
      room = r; start = end = hover = null; note('');
      guests = Math.min(guests, CAP[r]);
      $$r('.sp__tab').forEach(t => t.setAttribute('aria-pressed', String(t.dataset.room === r)));
      paint(); reads();
    }

    root.addEventListener('click', e => {
      const day = e.target.closest('.sp-day[data-d]'), tab = e.target.closest('.sp__tab'), nav = e.target.closest('[data-nav]'), g = e.target.closest('[data-g]');
      if (day && !day.disabled) { pick(parse(day.dataset.d)); paint(); reads(); day.focus({ preventScroll: true }); }
      else if (tab) setRoom(tab.dataset.room);
      else if (nav && !nav.disabled) { month = new Date(month.getFullYear(), month.getMonth() + Number(nav.dataset.nav), 1); draw(); reads(); }
      else if (g && !g.disabled) { guests = Math.max(1, Math.min(CAP[room], guests + Number(g.dataset.g))); reads(); }
      else if (e.target.closest('.sp__clear')) { start = end = hover = null; note(''); paint(); reads(); }
      else if (e.target.closest('.sp__cta') && start && end) note('Prototype: this is where the live site continues in the hotel’s own booking system. Nothing has been sent.');
    });
    grids.addEventListener('pointerover', e => { const b = e.target.closest('.sp-day[data-d]'); if (b && !b.disabled && start && !end) { hover = parse(b.dataset.d); paint(); } });
    grids.addEventListener('pointerleave', () => { if (hover) { hover = null; paint(); } });
    grids.addEventListener('focusin', e => { const b = e.target.closest('.sp-day[data-d]'); if (b && start && !end) { hover = parse(b.dataset.d); paint(); } });
    // arrow keys move between days and turn the page when they leave the shown months
    grids.addEventListener('keydown', e => {
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]; if (!step) return;
      const b = e.target.closest('.sp-day[data-d]'); if (!b) return;
      e.preventDefault();
      const to = addDays(parse(b.dataset.d), step); if (to < today) return;
      let el = $(`.sp-day[data-d="${key(to)}"]`, grids);
      if (!el) { month = new Date(to.getFullYear(), to.getMonth() - (step > 0 && wide.matches ? 1 : 0), 1); draw(); el = $(`.sp-day[data-d="${key(to)}"]`, grids); }
      if (el && !el.disabled) el.focus();
    });
    wide.addEventListener('change', () => { draw(); });

    draw(); reads();
    const ask = new URLSearchParams(location.search).get('room'); if (ask) setRoom(ask);
    // the ring, the phone list and the dock send the visitor here with a room in mind
    const focusTitle = () => { const t = $('.stay__title'); if (t) setTimeout(() => t.focus({ preventScroll: true }), 900); };
    window.__smyRoom = r => { setRoom(r); const go = $('.header__book'); if (go) go.click(); focusTitle(); };
    document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[data-room]'); if (a) { setRoom(a.dataset.room); focusTitle(); } });
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

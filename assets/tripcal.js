/*
  Календарь «Туда — обратно» для дат поездки (docs/TRIP-REMINDERS.md).
  Один файл на Mini App (/app/tripcal.js) и сайт (tools/build-site.mjs копирует в site/assets).
  Широкий экран — всплывает под полем, два месяца рядом; телефон — шторка снизу, один месяц.

  TripCal.open({
    anchor,            // элемент, под которым всплыть (на телефоне не нужен)
    start, end,        // 'YYYY-MM-DD' или ''
    min,               // самая ранняя дата (сегодня по Москве)
    dur,               // дней в тарифе — подсказка «По тарифу — до …»
    focus,             // 'start' | 'end' — что выбираем первым
    onDone(start, end) // обе даты или обе пустые
  })
  Язык — по <html lang> или window.PS_APP_LANG.
*/
(function () {
  if (window.TripCal) return;
  var EN = (window.PS_APP_LANG || document.documentElement.lang || '').slice(0, 2) === 'en';
  var T = EN
    ? { from: 'Departure', to: 'Return', pick: 'Pick a date', use: 'Select', done: 'Done', clear: 'Clear', close: 'Close', prev: 'Previous month', next: 'Next month',
        byPlan: function (d, n) { return 'Plan for ' + n + ' days — until ' + d; }, len: function (n) { return n + (n === 1 ? ' day' : ' days'); },
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        wd: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] }
    : { from: 'Туда', to: 'Обратно', pick: 'Выберите дату', use: 'Выбрать', done: 'Готово', clear: 'Сбросить', close: 'Закрыть', prev: 'Предыдущий месяц', next: 'Следующий месяц',
        byPlan: function (d, n) { return 'По тарифу на ' + n + ' ' + plural(n, 'день', 'дня', 'дней') + ' — до ' + d; },
        len: function (n) { return n + ' ' + plural(n, 'день', 'дня', 'дней'); },
        months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        short: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
        wd: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] };
  function plural(n, a, b, c) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c; }

  // Стили — tripcal.css рядом со скриптом (без инлайнового <style>: CSP Mini App)
  var CSS_URL = (document.currentScript && document.currentScript.src || '').replace(/tripcal\.js(\?.*)?$/, 'tripcal.css$1');

  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var iso = function (y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); };
  var parse = function (s) { return { y: +s.slice(0, 4), m: +s.slice(5, 7) - 1, d: +s.slice(8, 10) }; };
  var addDays = function (s, n) { return new Date(Date.parse(s + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10); };
  var span = function (a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 864e5) + 1; };
  var nice = function (s) { var p = parse(s); return EN ? T.short[p.m] + ' ' + p.d : p.d + ' ' + T.short[p.m]; };
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';

  var st = null; // открытый календарь

  function close() {
    if (!st) return;
    st.back.remove(); st.box.remove();
    document.removeEventListener('keydown', st.key);
    window.removeEventListener('resize', st.place);
    window.removeEventListener('scroll', st.place, true);
    var a = st.anchor; st = null;
    if (a && a.focus) try { a.focus({ preventScroll: true }); } catch (e) { /* */ }
  }

  function render() {
    var s = st, wide = s.wide, n = wide ? 2 : 1;
    var lastEnd = s.end || (s.start && s.hover && s.hover > s.start ? s.hover : '');
    var h = wide ? '' : '<div class="tc-grab"></div>';
    h += '<div class="tc-sum">' +
      '<button type="button" class="tc-f' + (s.focus === 'start' ? ' on' : '') + '" data-f="start"><span>' + T.from + '</span><b' + (s.start ? '>' + nice(s.start) : ' class="tc-ph">' + T.pick) + '</b></button>' +
      '<button type="button" class="tc-f' + (s.focus === 'end' ? ' on' : '') + '" data-f="end"><span>' + T.to + '</span><b' + (s.end ? '>' + nice(s.end) : ' class="tc-ph">' + T.pick) + '</b></button></div>';
    h += '<div class="tc-months">';
    var minP = parse(s.min), canPrev = s.y * 12 + s.m > minP.y * 12 + minP.m;
    h += '<button type="button" class="tc-nav l" data-nav="-1" aria-label="' + T.prev + '"' + (canPrev ? '' : ' disabled') + '>' + ARROW + '</button>';
    h += '<button type="button" class="tc-nav r" data-nav="1" aria-label="' + T.next + '"><span style="transform:scaleX(-1);display:flex">' + ARROW + '</span></button>';
    for (var k = 0; k < n; k++) {
      var y = s.y + Math.floor((s.m + k) / 12), m = (s.m + k) % 12;
      h += '<div><div class="tc-head">' + T.months[m] + (y !== minP.y ? ' ' + y : '') + '</div><div class="tc-grid">';
      for (var w = 0; w < 7; w++) h += '<div class="tc-wd' + (w > 4 ? ' we' : '') + '">' + T.wd[w] + '</div>';
      var first = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7, days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      for (var e = 0; e < first; e++) h += '<div></div>';
      for (var d = 1; d <= days; d++) {
        var v = iso(y, m, d), cls = 'tc-d', off = v < s.min || (s.focus === 'end' && s.start && v < s.start && false);
        if (v === s.min) cls += ' today';
        if (s.start && v === s.start) cls += ' s';
        if (lastEnd && v === lastEnd) cls += s.end ? ' e' : ' e prev';
        if (s.start && lastEnd && v > s.start && v < lastEnd) cls += ' in';
        h += '<div class="' + cls + '"><button type="button" data-d="' + v + '"' + (off ? ' disabled' : '') + ' aria-label="' + nice(v) + ' ' + y + '"' + (v === s.start || v === s.end ? ' aria-pressed="true"' : '') + '>' + d + '</button></div>';
      }
      h += '</div></div>';
    }
    h += '</div>';
    if (s.start && !s.end && s.dur > 1) {
      var pe = addDays(s.start, s.dur - 1);
      h += '<button type="button" class="tc-plan" data-plan="' + pe + '">' + T.byPlan(nice(pe), s.dur) + '<i>' + T.use + ' →</i></button>';
    }
    var len = s.start && s.end ? span(s.start, s.end) : 0;
    h += '<div class="tc-foot"><div class="tc-len">' + (len ? nice(s.start) + ' — ' + nice(s.end) + ' · ' + T.len(len) : '') + '</div>' +
      (s.start || s.end ? '<button type="button" class="tc-clear" data-clear>' + T.clear + '</button>' : '') +
      '<button type="button" class="tc-ok" data-ok' + (s.start && !s.end ? ' disabled' : '') + '>' + T.done + '</button></div>';
    s.box.innerHTML = h;
  }

  function pick(v) {
    var s = st;
    if (s.focus === 'start' || !s.start || v < s.start) {
      s.start = v;
      if (s.end && s.end < v) s.end = '';
      s.focus = 'end';
    } else {
      s.end = v; s.focus = 'end';
    }
    s.hover = '';
    render();
  }

  function done() {
    var s = st, a = s.start, b = s.end, cb = s.onDone;
    if (a && !b) return;
    close();
    cb && cb(a || '', b || '');
  }

  function place() {
    if (!st || !st.wide) return;
    var r = st.anchor.getBoundingClientRect(), bw = st.box.offsetWidth, bh = st.box.offsetHeight;
    var left = Math.min(Math.max(16, r.left), window.innerWidth - bw - 16);
    var top = r.bottom + 8;
    if (top + bh > window.innerHeight - 8) top = r.top - bh - 8 > 8 ? r.top - bh - 8 : window.innerHeight - bh - 8;
    st.box.style.left = left + 'px'; st.box.style.top = Math.max(8, top) + 'px';
  }

  window.TripCal = {
    open: function (o) {
      close();
      if (CSS_URL && !document.getElementById('tc-css')) { var c = document.createElement('link'); c.id = 'tc-css'; c.rel = 'stylesheet'; c.href = CSS_URL; document.head.appendChild(c); }
      var wide = window.innerWidth >= 720 && !!o.anchor;
      var D = /^\d{4}-\d{2}-\d{2}$/, ok = function (v) { return D.test(v || '') ? v : ''; };
      var start = ok(o.start), end = ok(o.end), min = ok(o.min) || new Date().toISOString().slice(0, 10);
      var show = parse(o.focus === 'end' && end ? end : start || min);
      var minP = parse(min);
      if (show.y * 12 + show.m < minP.y * 12 + minP.m) show = minP;
      var back = document.createElement('div'), box = document.createElement('div');
      back.className = 'tc-back' + (wide ? ' tc-pop' : '');
      box.className = 'tc ' + (wide ? 'tc-pop' : 'tc-sheet');
      box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', T.from + ' — ' + T.to);
      st = { anchor: o.anchor, wide: wide, start: start, end: end, min: min, dur: o.dur || 0, focus: o.focus === 'end' && start ? 'end' : 'start', y: show.y, m: show.m, hover: '', onDone: o.onDone, back: back, box: box };
      st.key = function (e) { if (e.key === 'Escape') close(); };
      st.place = place;
      back.addEventListener('click', close);
      box.addEventListener('click', function (e) {
        var t = e.target.closest('button');
        if (!t || t.disabled) return;
        if (t.dataset.d) return pick(t.dataset.d);
        if (t.dataset.nav) { var k = st.m + +t.dataset.nav; st.y += Math.floor(k / 12); st.m = (k % 12 + 12) % 12; render(); return; }
        if (t.dataset.f) { st.focus = t.dataset.f === 'end' && !st.start ? 'start' : t.dataset.f; render(); return; }
        if (t.dataset.plan) { st.end = t.dataset.plan; render(); return; }
        if (t.hasAttribute('data-clear')) { st.start = ''; st.end = ''; st.focus = 'start'; render(); return; }
        if (t.hasAttribute('data-ok')) return done();
      });
      box.addEventListener('mouseover', function (e) {
        var t = e.target.closest('button[data-d]');
        var v = t && !t.disabled && st.start && !st.end && st.focus === 'end' ? t.dataset.d : '';
        if (v !== st.hover) { st.hover = v; render(); }
      });
      document.body.appendChild(back); document.body.appendChild(box);
      document.addEventListener('keydown', st.key);
      if (wide) { window.addEventListener('resize', place); window.addEventListener('scroll', place, true); }
      render(); place();
    },
    close: close,
    /** «13 ноября» / «Nov 13» — для полей на странице */
    label: function (v) { return /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? nice(v) : ''; }
  };
})();

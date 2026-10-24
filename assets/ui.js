/*
  Поведение поверх макетов, общее для всех страниц (стили — ui.css).
  Подключается сразу после runtime макетов, ДО монтирования страницы.

    • PSLogic — логика экранов перерисовывается по событию ps:refresh (данные кабинета, свежие цены);
    • свежие цены с API — в фоне, страница их не ждёт;
    • согласие на cookie — запоминается (cookie ps_consent на год);
    • якоря: плавная прокрутка, index.html#how с другой страницы;
    • «Как это работает» на главной: шаги кликабельны, после 4-го остаётся последний экран;
    • подсказки в поиске направлений (страна, регион, город, остров, штат);
    • мобильное меню выезжает поверх страницы;
    • [data-copy] — копирование по нажатию (номер заказа и т. п.).
*/
(function () {
  'use strict';
  var doc = document, root = window, html = doc.documentElement;
  var PS = root.PS || {};
  var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NB = ' ';

  /* ---------- Перерисовка логики экранов ---------- */
  if (root.DCLogic) {
    root.PSLogic = class extends root.DCLogic {
      constructor(props) {
        super(props);
        var self = this;
        root.addEventListener('ps:refresh', function () { try { self.setState({ psv: Date.now() }); } catch (e) {} });
      }
    };
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // Страница смонтирована runtime макетов
  function mounted(fn) {
    var r = doc.getElementById('dc-root');
    if (r && r.children.length) return fn(r);
    var mo = new MutationObserver(function () {
      var x = doc.getElementById('dc-root');
      if (x && x.children.length) { mo.disconnect(); fn(x); }
    });
    mo.observe(html, { childList: true, subtree: true });
  }
  function toast(text) {
    var t = doc.createElement('div');
    t.className = 'ps-toast'; t.setAttribute('role', 'status'); t.textContent = text;
    doc.body.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 300); }, 1800);
  }
  PS.toast = toast;

  /* ---------- Свежие цены с API ---------- */
  (function () {
    var api = root.SITE_CONFIG && root.SITE_CONFIG.apiUrl;
    if (!api || !root.fetch) return;
    var go = function () {
      root.fetch(api.replace(/\/$/, '') + '/api/catalog/storefront').then(function (r) { return r.ok ? r.json() : null; }).then(function (cat) {
        if (!cat || !cat.countries) return;
        try { localStorage.setItem('ps.cat', JSON.stringify(cat)); } catch (e) {}
        var cur = root.PS_CATALOG;
        if (cur && cur.meta && cat.meta && cur.meta.syncedAt === cat.meta.syncedAt) return; // уже показаны эти цены
        if (PS.setCatalog && PS.setCatalog(cat)) PS.refresh();
      }).catch(function () {});
    };
    // После первой отрисовки, чтобы не спорить за сеть с картинками первого экрана
    if (doc.readyState === 'complete') setTimeout(go, 0); else root.addEventListener('load', function () { setTimeout(go, 0); });
  })();

  /* ---------- Контент из админки: баннеры и техработы, «Помощь», «Совместимость» ---------- */
  // GET /api/content/*; страница рисуется сразу по встроенным текстам, ответ API подставляется следом
  PS.CONTENT = PS.CONTENT || {};
  (function () {
    var api = root.SITE_CONFIG && root.SITE_CONFIG.apiUrl;
    if (!api || !root.fetch) return;
    var base = api.replace(/\/$/, '') + '/api/content/', page = location.pathname.split('/').pop() || 'index.html';
    function get(path, key, then) {
      root.fetch(base + path, PS.lang === 'en' ? { headers: { 'x-lang': 'en' } } : undefined).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (!j) return;
        PS.CONTENT[key] = j;
        if (then) then(j); else PS.refresh();
      }).catch(function () {});
    }
    get('status', 'status', banners);
    if (page === 'help.html') get('help', 'help');
    if (page === 'compatibility.html') get('devices', 'devices');
  })();
  // Плашки над страницей: техработы (покупки закрыты) и баннеры — на весь сайт или на страницу страны (scope = код)
  function banners(st) {
    var here = (PS.qp && (PS.qp('c') || PS.qp('r')) || '').toUpperCase(), list = [], hidden = {};
    try { hidden = JSON.parse(sessionStorage.getItem('ps.bnr') || '{}'); } catch (e) {}
    if (st.maintenance) list.push({ id: 'mt', kind: 'warn', text: 'Технические работы: покупки временно недоступны' + (st.maintenance.until ? ' до\u00a0' + st.maintenance.until : '') + '. ' + (st.maintenance.message || 'Купленные eSIM работают, кабинет и поддержка доступны.') });
    (st.banners || []).forEach(function (b) { if (b.scope === 'all' || b.scope.toUpperCase() === here) list.push(b); });
    list.forEach(function (b) {
      if (hidden[b.id] || doc.getElementById('ps-bnr-' + b.id)) return;
      var el = doc.createElement('div');
      el.id = 'ps-bnr-' + b.id; el.className = 'ps-bnr ' + (b.kind === 'info' ? 'info' : 'warn'); el.setAttribute('role', 'status');
      var t = doc.createElement('span'); t.textContent = b.text; el.appendChild(t);
      var x = doc.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Скрыть'); x.textContent = '✕';
      x.onclick = function () { el.remove(); hidden[b.id] = 1; try { sessionStorage.setItem('ps.bnr', JSON.stringify(hidden)); } catch (e) {} };
      if (b.id !== 'mt') el.appendChild(x);
      doc.body.insertBefore(el, doc.body.firstChild);
    });
  }
  // «Помощь»: статьи из админки (вкладки — по разделам), иначе встроенный список
  var HELP_TABS = { 'Перед покупкой': 'before', 'Оплата': 'pay', 'Установка': 'install', 'В поездке': 'trip', 'Возврат': 'refund' };
  PS.helpFaq = function (fallback) {
    var h = PS.CONTENT.help;
    if (!h || !h.articles || !h.articles.length) return fallback;
    return h.articles.map(function (a) { return { c: HELP_TABS[a.section] || 'before', q: a.title, a: a.body }; });
  };
  // «Совместимость»: модели из админки по вкладкам брендов, иначе встроенный список
  var BRAND_TABS = { apple: 'apple', samsung: 'samsung', google: 'google', xiaomi: 'xiaomi', redmi: 'xiaomi', poco: 'xiaomi' };
  PS.devicesDb = function (fallback) {
    var d = PS.CONTENT.devices;
    if (!d || !d.devices || !d.devices.length) return fallback;
    var out = { apple: [], samsung: [], google: [], xiaomi: [], other: [] };
    d.devices.forEach(function (x) {
      var tab = BRAND_TABS[String(x.brand).toLowerCase()] || 'other';
      var name = tab !== 'other' || String(x.model).toLowerCase().indexOf(String(x.brand).toLowerCase()) === 0 ? x.model : x.brand + ' ' + x.model;
      out[tab].push([name, x.esim === 'yes' || x.esim === 'no' ? x.esim : 'check']);
    });
    // Порядок — как во встроенном списке (новые модели сверху), добавленные в админке — первыми
    Object.keys(out).forEach(function (tab) {
      var known = (fallback[tab] || []).map(function (r) { return r[0]; });
      out[tab].sort(function (a, b) { return known.indexOf(a[0]) - known.indexOf(b[0]); });
    });
    return out;
  };

  /* ---------- Согласие на cookie ---------- */
  function consent() {
    var m = doc.cookie.match(/(?:^|;\s*)ps_consent=([a-z]+)/);
    if (m) return m[1];
    try { return localStorage.getItem('ps.consent') || ''; } catch (e) { return ''; }
  }
  if (consent()) html.classList.add('ps-ck-done');
  doc.addEventListener('click', function (e) {
    var l = e.target.closest && e.target.closest('label[for="ck-ok"]');
    if (!l) return;
    var v = /необходим|necessary/i.test(l.textContent) ? 'necessary' : 'all';
    doc.cookie = 'ps_consent=' + v + '; max-age=31536000; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    try { localStorage.setItem('ps.consent', v); } catch (x) {}
    setTimeout(function () { html.classList.add('ps-ck-done'); }, 0);
  });

  /* ---------- Якоря: плавная прокрутка, переход на якорь другой страницы ---------- */
  function samePage(a) {
    var p = function (x) { return x.replace(/\/index\.html$/, '/'); };
    return a.origin === location.origin && p(a.pathname) === p(location.pathname);
  }
  function toHash(hash, smooth) {
    var id = decodeURIComponent(hash.slice(1)), el = id && doc.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: smooth && !reduce ? 'smooth' : 'instant', block: 'start' });
    return true;
  }
  doc.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || a.getAttribute('href') === '#chat' || a.target === '_blank' || !a.hash || !samePage(a)) return;
    if (!doc.getElementById(decodeURIComponent(a.hash.slice(1)))) return;
    e.preventDefault();
    closeMenu();
    toHash(a.hash, true);
    if (location.hash !== a.hash) history.pushState(null, '', a.hash);
  });
  // Пришли по ссылке index.html#how: раздел появляется только после монтирования — докручиваем сами
  if (location.hash && location.hash !== '#chat') {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    mounted(function () {
      var tries = 0;
      (function again() {
        if (toHash(location.hash, false)) {
          // Картинки выше могли догрузиться и сдвинуть раздел — поправляем ещё раз
          setTimeout(function () { toHash(location.hash, false); }, 450);
          return;
        }
        if (++tries < 40) setTimeout(again, 50);
      })();
    });
  }

  /* ---------- Копирование по нажатию ---------- */
  function copy(text) {
    if (navigator.clipboard && root.isSecureContext) return navigator.clipboard.writeText(text).catch(function () { fallback(); });
    fallback();
    function fallback() { var t = doc.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; doc.body.appendChild(t); t.select(); try { doc.execCommand('copy'); } catch (e) {} t.remove(); }
  }
  doc.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-copy]');
    if (!el) return;
    e.preventDefault();
    var v = el.getAttribute('data-copy').replace(/^#/, '');
    copy(v);
    toast((el.getAttribute('data-copy-msg') || 'Скопировано') + ': ' + v);
  });
  doc.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-copy]')) { e.preventDefault(); e.target.click(); }
  });

  /* ---------- «Как это работает»: шаги кликабельны, последний экран остаётся ---------- */
  // Анимация макета — 16 с, по 4 с на шаг. Управляем всеми её анимациями сразу (Web Animations API)
  var STEP = 4000, END = 15500;
  function howInit() {
    var grid = doc.querySelector('#how .how-grid');
    if (!grid || grid.__ps || !grid.getAnimations) return;
    grid.__ps = true;
    var steps = grid.querySelectorAll('ol > li.hs'), dots = grid.querySelectorAll('.how-dots i');
    var scr = grid.querySelector('.scr');
    var scrollDriven = function () { return /--how/.test(getComputedStyle(scr).animationTimeline || ''); };
    var anims = function () {
      return grid.getAnimations({ subtree: true }).filter(function (a) {
        var t = a.effect && a.effect.getTiming();
        return t && t.duration === 16000 && a.timeline === doc.timeline;
      });
    };
    var timer = 0;
    function freeze(t) { anims().forEach(function (a) { a.pause(); a.currentTime = t; }); }
    function play(t) {
      clearTimeout(timer);
      if (reduce) { freeze(t + 1500); return; }
      anims().forEach(function (a) { a.currentTime = t; a.play(); });
      timer = setTimeout(function () { freeze(END); }, END - t);
    }
    function go(i) {
      if (scrollDriven()) {
        // На телефоне экраны листаются прокруткой — докручиваем до нужного шага
        var r = grid.getBoundingClientRect(), span = grid.offsetHeight - innerHeight;
        root.scrollTo({ top: scrollY + r.top + Math.max(0, span) * (i * 0.25 + 0.1), behavior: reduce ? 'auto' : 'smooth' });
        return;
      }
      play(i * STEP);
    }
    [].forEach.call(steps, function (li, i) {
      li.setAttribute('role', 'button'); li.tabIndex = 0;
      li.setAttribute('aria-label', 'Показать шаг ' + (i + 1) + ': ' + (li.textContent || '').replace(/\s+/g, ' ').trim().replace(/^0\d\s*/, ''));
      li.addEventListener('click', function () { go(i); });
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(i); } });
    });
    [].forEach.call(dots, function (d, i) { d.setAttribute('role', 'button'); d.setAttribute('aria-label', 'Шаг ' + (i + 1)); d.addEventListener('click', function () { go(i); }); });
    if (scrollDriven()) return;
    // До появления на экране — стоим на первом шаге, потом проигрываем один раз и останавливаемся на последнем
    freeze(600);
    if (!('IntersectionObserver' in root)) { play(0); return; }
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect(); play(0);
    }, { threshold: 0.35 });
    io.observe(grid);
  }

  /* ---------- Подсказки в поиске направлений ---------- */
  var sug = null, sugFor = null, sugItems = [], sugIx = -1;
  function sugBox() {
    if (sug) return sug;
    sug = doc.createElement('div');
    sug.className = 'ps-sug'; sug.setAttribute('role', 'listbox'); sug.id = 'ps-sug'; sug.hidden = true;
    sug.addEventListener('mousedown', function (e) { e.preventDefault(); }); // не терять фокус поля
    sug.addEventListener('click', function (e) { var a = e.target.closest('a'); if (a) { hideSug(); } });
    doc.body.appendChild(sug);
    return sug;
  }
  function wantsSug(el) { return el && el.matches && el.matches('input[type="search"]') && el.closest('.hsearch, .ps-menu, [data-ps-suggest]'); }
  function placeSug() {
    if (!sug || sug.hidden || !sugFor) return;
    var box = (sugFor.closest('.hsearch, .ps-msearch') || sugFor).getBoundingClientRect();
    sug.style.left = Math.max(8, box.left) + 'px';
    sug.style.width = Math.min(box.width, innerWidth - 16) + 'px';
    var below = innerHeight - box.bottom;
    if (below < 260 && box.top > below) { sug.style.top = ''; sug.style.bottom = (innerHeight - box.top + 8) + 'px'; }
    else { sug.style.bottom = ''; sug.style.top = (box.bottom + 8) + 'px'; }
  }
  function hideSug() { if (sug) sug.hidden = true; sugIx = -1; if (sugFor) sugFor.removeAttribute('aria-activedescendant'); }
  function showSug(input) {
    var q = (input.value || '').trim();
    sugFor = input;
    if (!q || !PS.search) { hideSug(); return; }
    sugItems = PS.search(q, 7);
    var box = sugBox();
    input.setAttribute('aria-controls', 'ps-sug'); input.setAttribute('aria-autocomplete', 'list');
    if (!sugItems.length) {
      box.innerHTML = '<div class="ps-sug-none">Не нашли «' + esc(q) + '». <a href="countries.html?q=' + encodeURIComponent(q) + '">Все страны</a> или <a href="' + PS.dest('GL') + '">eSIM «Весь мир»</a></div>';
    } else {
      box.innerHTML = sugItems.map(function (x, i) {
        var ico = x.flag ? '<img src="' + esc(x.flag) + '" alt="">' : '<span class="ps-sug-g" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg></span>';
        var sub = x.via ? 'eSIM ' + x.name + (x.sub ? ' · ' + x.sub : '') : (x.isRegion ? 'Регион · ' + x.sub : 'eSIM · ' + x.sub);
        return '<a role="option" id="ps-sug-' + i + '" href="' + esc(x.href) + '" class="ps-sug-i">' + ico +
          '<span class="ps-sug-t"><b>' + esc(x.via || x.name) + '</b><small>' + esc(sub) + '</small></span><span class="ps-sug-p">от' + NB + esc(x.price) + NB + '₽</span></a>';
      }).join('');
    }
    box.hidden = false; sugIx = -1;
    placeSug();
  }
  function markSug() {
    [].forEach.call(sug.querySelectorAll('.ps-sug-i'), function (a, i) { a.classList.toggle('on', i === sugIx); a.setAttribute('aria-selected', String(i === sugIx)); });
    if (sugIx >= 0) sugFor.setAttribute('aria-activedescendant', 'ps-sug-' + sugIx); else sugFor.removeAttribute('aria-activedescendant');
  }
  doc.addEventListener('input', function (e) { if (wantsSug(e.target)) showSug(e.target); });
  doc.addEventListener('focusin', function (e) { if (wantsSug(e.target) && e.target.value) showSug(e.target); });
  doc.addEventListener('focusout', function (e) { if (e.target === sugFor) setTimeout(hideSug, 120); });
  doc.addEventListener('keydown', function (e) {
    if (!wantsSug(e.target)) return;
    var open = sug && !sug.hidden && sugItems.length;
    if (e.key === 'ArrowDown' && open) { e.preventDefault(); sugIx = (sugIx + 1) % sugItems.length; markSug(); }
    else if (e.key === 'ArrowUp' && open) { e.preventDefault(); sugIx = (sugIx - 1 + sugItems.length) % sugItems.length; markSug(); }
    else if (e.key === 'Escape') hideSug();
    else if (e.key === 'Enter') {
      // Выбранная подсказка, иначе лучшее совпадение (site.js откроет каталог, если совпадений нет)
      var pick = open ? sugItems[Math.max(0, sugIx)] : null;
      if (pick) { e.preventDefault(); e.stopPropagation(); hideSug(); location.href = pick.href; }
    }
  }, true);
  root.addEventListener('resize', placeSug);
  root.addEventListener('scroll', placeSug, { passive: true });

  /* ---------- Мобильное меню: выезжает поверх страницы ---------- */
  var menu = null, lastFocus = null;
  var ICO = {
    arr: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C92A3" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    find: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A6175" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    tg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 4L3 11l6 2.5L11.5 20 15 15l4 3z"/><path d="M9 13.5L21 4"/></svg>',
    logo: '<svg width="28" height="28" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#2F5BFF"/><circle cx="13.5" cy="15.5" r="3.2" fill="#FFFFFF"/><circle cx="26.5" cy="15.5" r="3.2" fill="#FF7A45"/><path d="M11 23.5C13.5 30.5 26.5 30.5 29 23.5" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/></svg>'
  };
  function menuHtml() {
    var PSA = root.PSA, u = PSA && PSA.user ? PSA.user() : null;
    var bot = (root.SITE_CONFIG && root.SITE_CONFIG.telegramBot) || 'PrivetSimBot';
    var here = location.pathname.split('/').pop() || 'index.html';
    var howHref = here === 'index.html' ? '#how' : 'index.html#how';
    var mi = function (href, label, tail) { return '<a class="mi" href="' + href + '">' + label + (tail || ICO.arr) + '</a>'; };
    var bal = u && PSA.balance ? PSA.rub(PSA.balance().total) : '';
    return '<div class="ps-menu-hd"><a href="index.html" class="ps-menu-logo" aria-label="Привет SIM — на главную">' + ICO.logo +
      '<span><b>Привет</b><i class="mono">SIM</i></span></a><button type="button" class="ps-menu-x" data-menu-close aria-label="Закрыть меню">' + ICO.x + '</button></div>' +
      '<div class="ps-menu-bd">' +
        '<label class="ps-msearch">' + ICO.find + '<input type="search" placeholder="Куда едете?" aria-label="Куда едете?" enterkeyhint="search"><a href="countries.html" hidden>Найти</a></label>' +
        (u ? '<a class="ps-menu-me" href="profile.html"><span class="ps-menu-ava">' + esc((u.email || '?').charAt(0).toUpperCase()) + '</span><span><b>' + esc(u.email || 'Профиль') + '</b><small>Профиль и настройки</small></span>' + ICO.arr + '</a>' : '') +
        '<nav aria-label="Основная">' +
          mi('countries.html', 'Страны') + mi(howHref, 'Как это работает') + mi('compatibility.html', 'Совместимость') + mi('help.html', 'Помощь') +
          (u ? mi('account.html', 'Мои eSIM') +
            mi('wallet.html', 'Баланс', '<span class="mono ps-menu-bal">' + esc(bal) + '</span>') +
            mi('referral.html', 'Пригласить друзей', '<span class="ps-menu-25">25%</span>') : '') +
        '</nav>' +
        '<a class="btn btn-dark ps-menu-tg" href="https://t.me/' + esc(bot) + '" target="_blank" rel="noopener">' + ICO.tg + 'Открыть бота в Telegram</a>' +
      '</div>' +
      '<div class="ps-menu-ft">' +
        (u ? '<a class="btn btn-ghost" href="login.html?logout=1">Выйти</a>' : '<a class="btn btn-ghost" href="' + (PSA && PSA.loginUrl ? PSA.loginUrl('account.html') : 'login.html') + '">Личный кабинет</a>') +
        '<a class="btn btn-primary" href="countries.html">Купить eSIM</a>' +
      '</div>';
  }
  function openMenu() {
    if (!menu) {
      menu = doc.createElement('div');
      menu.className = 'ps-menu-wrap';
      menu.innerHTML = '<div class="ps-menu-back" data-menu-close></div><div class="ps-menu" role="dialog" aria-modal="true" aria-label="Меню"></div>';
      menu.addEventListener('click', function (e) { if (e.target.closest('[data-menu-close]')) closeMenu(); });
      doc.body.appendChild(menu);
    }
    menu.querySelector('.ps-menu').innerHTML = menuHtml();
    lastFocus = doc.activeElement;
    html.classList.add('ps-menu-lock');
    menu.hidden = false;
    requestAnimationFrame(function () { menu.classList.add('on'); });
    setTimeout(function () { var x = menu.querySelector('.ps-menu-x'); if (x) x.focus(); }, 60);
  }
  function closeMenu() {
    if (!menu || !menu.classList.contains('on')) return;
    menu.classList.remove('on');
    html.classList.remove('ps-menu-lock');
    hideSug();
    setTimeout(function () { if (!menu.classList.contains('on')) menu.hidden = true; }, 320);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  PS.openMenu = openMenu;
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="menu.html"]');
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    openMenu();
  });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  // Ссылка внутри меню на эту же страницу (например, «Как это работает» на главной) — меню закрываем
  root.addEventListener('pageshow', function () { closeMenu(); });

  /* ---------- После монтирования страницы ---------- */
  mounted(function () {
    howInit();
    // Главная перерисовывается (вкладки, данные) — новые элементы «Как это работает» не появляются,
    // но на всякий случай подключаемся повторно
    root.addEventListener('ps:refresh', function () { setTimeout(howInit, 0); });
  });
})();

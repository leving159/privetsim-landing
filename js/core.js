/*
  Общее для всех страниц: шапка, меню, подвал, чат поддержки, тост, помощники.
  Страница подключает: config.js → js/catalog.js → js/core.js → свой js/<страница>.js
*/
(function () {
  'use strict';

  var C = window.SITE_CONFIG || {};
  var CAT = window.CATALOG;
  var doc = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Помощники ---------- */
  var $ = function (sel, root) { return (root || doc).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); };
  var money = function (n) { return new Intl.NumberFormat('ru-RU').format(n) + ' ₽'; };
  var norm = function (s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').trim(); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var param = function (k) { return new URLSearchParams(location.search).get(k); };

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }
  var days = function (n) { return n + ' ' + plural(n, 'день', 'дня', 'дней'); };

  var GLOBE = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>';
  function flag(d, size) {
    var code = d.flag || (d.type === 'region' ? null : d.code);
    if (code) return '<img class="flag" src="assets/flags/' + code + '.svg" alt="" width="' + size + '" height="' + size + '" loading="lazy">';
    return '<span class="globe" style="width:' + size + 'px;height:' + size + 'px" aria-hidden="true">' + GLOBE + '</span>';
  }

  var url = {
    country: function (code) { return 'country.html?c=' + code; },
    place: function (code) { return 'place.html?c=' + code; },
    checkout: function (code, plan, d, q) { return 'checkout.html?c=' + code + '&p=' + plan + (d ? '&d=' + d : '') + (q > 1 ? '&q=' + q : ''); }
  };

  var tg = function (u) { return u ? 'https://t.me/' + u : ''; };
  var LINKS = {
    bot: tg(C.botUsername),
    support: tg(C.supportUsername) || (C.email ? 'mailto:' + C.email : ''),
    email: C.email ? 'mailto:' + C.email : ''
  };

  var ICON = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>'
  };

  var LOGO = '<svg class="logo__mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#2F5BFF"/><circle cx="13.5" cy="15.5" r="3.2" fill="#fff"/><circle cx="26.5" cy="15.5" r="3.2" fill="#FF7A45"/><path d="M11 23.5c2.5 7 15.5 7 18 0" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/></svg><span class="logo__word">Привет</span><span class="logo__tag">SIM</span>';

  /* ---------- Шапка, меню, подвал ---------- */
  var page = doc.body.getAttribute('data-page') || '';

  function navLink(href, text, id) {
    return '<a href="' + href + '"' + (id === page ? ' aria-current="page"' : '') + '>' + text + '</a>';
  }

  function renderHeader() {
    var slot = $('[data-slot="header"]');
    if (!slot) return;
    slot.outerHTML =
      '<a class="skip-link" href="#main">Перейти к содержимому</a>' +
      '<header class="header" id="top"><div class="container header__row">' +
        '<a class="logo" href="index.html" aria-label="Привет SIM — на главную">' + LOGO + '</a>' +
        '<nav class="nav" aria-label="Основное меню">' +
          navLink('countries.html', 'Страны', 'countries') +
          navLink('index.html#how', 'Как это работает', 'how') +
          navLink('compatibility.html', 'Совместимость', 'compatibility') +
          navLink('help.html', 'Помощь', 'help') +
        '</nav>' +
        '<div class="header__actions">' +
          '<a class="header__login" href="login.html">Войти</a>' +
          '<a class="btn btn--primary btn--md header__cta" href="countries.html">Купить eSIM</a>' +
          '<button class="burger" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span></button>' +
        '</div>' +
      '</div></header>' +
      '<div class="mobile-menu" id="mobile-menu" hidden>' +
        '<nav class="mobile-menu__nav" aria-label="Мобильное меню">' +
          '<a href="countries.html">Страны и цены</a>' +
          '<a href="index.html#how">Как это работает</a>' +
          '<a href="compatibility.html">Подходит ли телефон</a>' +
          '<a href="help.html">Помощь и вопросы</a>' +
          '<a href="business.html">Партнёрам и бизнесу</a>' +
          '<a href="login.html">Войти</a>' +
        '</nav>' +
        '<div class="mobile-menu__foot">' +
          '<a class="btn btn--primary btn--lg btn--block" href="countries.html">Выбрать страну <span aria-hidden="true">→</span></a>' +
          (LINKS.bot ? '<a class="btn btn--secondary btn--lg btn--block" href="' + LINKS.bot + '" target="_blank" rel="noopener">Открыть Telegram-бота</a>' : '') +
          '<p class="mobile-menu__note">Поддержка 24/7 · отвечаем моментально</p>' +
        '</div>' +
      '</div>';
  }

  function sellerLine() {
    var s = C.seller || {};
    var parts = [s.name, s.inn && 'ИНН ' + s.inn, s.ogrn && 'ОГРН ' + s.ogrn, s.address].filter(Boolean);
    return parts.length ? ' · ' + esc(parts.join(' · ')) : '';
  }

  function renderFooter() {
    var slot = $('[data-slot="footer"]');
    if (!slot) return;
    var pay = '<span class="pill">СБП</span>' + (C.payments && C.payments.usdt ? '<span class="pill">USDT · TRON, TON, BEP-20</span>' : '');
    slot.outerHTML =
      (LINKS.bot ?
        '<section class="tgband"><div class="container"><div class="tgband__box">' +
          '<div><b>Привет SIM в Telegram</b><p>Бот и Mini App: купить, пополнить и проверить остаток, не выходя из чата</p></div>' +
          '<a class="btn btn--light btn--md" href="' + LINKS.bot + '" target="_blank" rel="noopener">Открыть бота <span aria-hidden="true">→</span></a>' +
        '</div></div></section>' : '') +
      '<footer class="footer"><div class="container">' +
        '<div class="footer__grid">' +
          '<div class="footer__brand">' +
            '<a class="logo" href="index.html" aria-label="Привет SIM — на главную">' + LOGO + '</a>' +
            '<p>eSIM для путешествий. Сделано для тех, кто любит новые места.</p>' +
            '<p class="footer__pay"><span class="label">Принимаем</span> ' + pay + '</p>' +
          '</div>' +
          '<nav aria-label="Направления"><h3>Направления</h3>' +
            '<a href="' + url.country('tr') + '">Турция</a><a href="' + url.country('ae') + '">ОАЭ</a>' +
            '<a href="' + url.country('th') + '">Таиланд</a><a href="' + url.country('europe') + '">Европа</a>' +
            '<a href="countries.html">Все страны</a></nav>' +
          '<nav aria-label="Помощь"><h3>Помощь</h3>' +
            '<a href="help.html#install">Как установить</a><a href="compatibility.html">Совместимость</a>' +
            '<a href="help.html#faq">Вопросы</a>' +
            (LINKS.support ? '<a href="' + LINKS.support + '" target="_blank" rel="noopener">Поддержка в Telegram</a>' : '') +
          '</nav>' +
          '<nav aria-label="Аккаунт и документы"><h3>Аккаунт и документы</h3>' +
            '<a href="login.html">Войти</a><a href="business.html">Партнёрам и бизнесу</a>' +
            '<a href="legal.html?doc=offer">Публичная оферта</a><a href="legal.html?doc=privacy">Конфиденциальность</a>' +
            '<a href="legal.html?doc=refund">Возврат</a><a href="legal.html?doc=requisites">Реквизиты</a>' +
          '</nav>' +
        '</div>' +
        '<p class="footer__legal">© ' + new Date().getFullYear() + ' Привет SIM' + sellerLine() + '</p>' +
      '</div></footer>';
  }

  renderHeader();
  renderFooter();

  /* ---------- Мобильное меню ---------- */
  var burger = $('.burger');
  var menu = $('#mobile-menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.hidden = !open;
    doc.documentElement.classList.toggle('menu-open', open);
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });
    window.matchMedia('(min-width: 960px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  var header = $('.header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Ссылки на бота/поддержку в разметке страниц ---------- */
  $$('[data-link]').forEach(function (a) {
    var u = LINKS[a.getAttribute('data-link')];
    if (!u) { a.hidden = true; return; }
    a.href = u;
    if (/^https?:/.test(u)) { a.target = '_blank'; a.rel = 'noopener'; }
  });
  $$('[data-requires]').forEach(function (el) { if (!LINKS[el.getAttribute('data-requires')]) el.hidden = true; });
  $$('[data-demo]').forEach(function (el) { if (!C.demo) el.hidden = true; });

  /* ---------- Тост ---------- */
  var toastEl, toastTimer;
  function toast(text, sticky) {
    if (!toastEl) {
      toastEl = doc.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      doc.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    if (!sticky) toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 4000);
  }

  /* ---------- Копирование ---------- */
  doc.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    var text = b.getAttribute('data-copy');
    var done = function () {
      toast('Скопировано');
      b.classList.add('is-copied');
      setTimeout(function () { b.classList.remove('is-copied'); }, 1500);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { toast('Не получилось скопировать — выделите текст вручную'); });
    else toast('Не получилось скопировать — выделите текст вручную');
  });

  /* ---------- Вкладки (role=tablist с data-tabs) ---------- */
  $$('[data-tabs]').forEach(function (list) {
    var group = list.getAttribute('data-tabs');
    var tabs = $$('[role="tab"]', list);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = doc.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      list.dispatchEvent(new CustomEvent('tabchange', { detail: { id: tab.getAttribute('data-id'), group: group } }));
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
      });
    });
  });

  /* ---------- Псевдо-QR для вёрстки (настоящий придёт из API) ---------- */
  function fakeQr(seed, size) {
    var n = 25, cells = '', h = 0, i;
    for (i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    var rnd = function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
    var finder = function (x, y) { return (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9); };
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (!finder(x, y) && rnd() > 0.52) cells += 'M' + x + ' ' + y + 'h1v1h-1z';
    var f = function (x, y) { return '<path d="M' + x + ' ' + y + 'h7v7h-7z M' + (x + 1) + ' ' + (y + 1) + 'v5h5v-5z" fill-rule="evenodd"/><path d="M' + (x + 2) + ' ' + (y + 2) + 'h3v3h-3z"/>'; };
    return '<svg class="qr" viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" width="' + size + '" height="' + size + '" role="img" aria-label="QR-код"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="#fff"/><g fill="#0E1220"><path d="' + cells + '"/>' + f(0, 0) + f(n - 7, 0) + f(0, n - 7) + '</g></svg>';
  }

  /* ---------- Проверка email (тексты из брендбука) ---------- */
  var TYPO = { 'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmai.com': 'gmail.com', 'gmial.com': 'gmail.com', 'gnail.com': 'gmail.com', 'mail.r': 'mail.ru', 'mail.ri': 'mail.ru', 'mial.ru': 'mail.ru', 'yandex.r': 'yandex.ru', 'yandex.ry': 'yandex.ru', 'yandx.ru': 'yandex.ru', 'ya.r': 'ya.ru', 'icloud.co': 'icloud.com', 'iclod.com': 'icloud.com', 'outlook.co': 'outlook.com', 'bk.r': 'bk.ru', 'list.r': 'list.ru', 'inbox.r': 'inbox.ru', 'rambler.r': 'rambler.ru' };
  function checkEmail(v) {
    v = String(v || '').trim();
    if (!v) return { error: 'Укажите email — на него придёт eSIM' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return { error: 'Похоже, в адресе ошибка. Пример: name@mail.ru' };
    var dom = v.split('@')[1].toLowerCase();
    if (TYPO[dom]) return { ok: true, suggest: v.split('@')[0] + '@' + TYPO[dom] };
    return { ok: true };
  }

  // Поле: показать/скрыть ошибку под полем
  function fieldError(input, msg) {
    var wrap = input.closest('.field');
    var box = wrap && $('.field__error', wrap);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (wrap) wrap.classList.toggle('is-error', !!msg);
    if (box) { box.textContent = msg || ''; box.hidden = !msg; }
  }

  /* ---------- Поиск направлений (общий для главной и каталога) ---------- */
  function searchDest(q, limit) {
    q = norm(q);
    if (!q) return [];
    var starts = [], has = [];
    CAT.all().forEach(function (d) {
      var hay = norm(d.name + ' ' + (d.aliases || '') + ' ' + (d.place || ''));
      if (norm(d.name).indexOf(q) === 0) starts.push(d);
      else if (hay.indexOf(q) !== -1) has.push(d);
    });
    return starts.concat(has).slice(0, limit || 6);
  }

  function attachSearch(form) {
    var input = $('.search__input', form);
    var list = $('.search__list', form);
    var items = [], active = -1;
    function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; }
    function go(d) { close(); location.href = url.country(d.code); }
    function highlight(i) {
      active = i;
      $$('.search__item', list).forEach(function (li, k) { li.classList.toggle('is-active', k === i); li.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      if (i >= 0) input.setAttribute('aria-activedescendant', list.id + '-' + i);
    }
    function render() {
      var q = input.value;
      items = searchDest(q);
      if (!norm(q)) { close(); return; }
      list.innerHTML = items.length ? items.map(function (d, i) {
        return '<li class="search__item" role="option" id="' + list.id + '-' + i + '" data-i="' + i + '">' + flag(d, 24) +
          '<span class="search__name">' + esc(d.name) + (d.type === 'region' ? ' <small>регион</small>' : '') + '</span>' +
          '<span class="search__price mono">от ' + money(d.price) + '</span></li>';
      }).join('') : '<li class="search__empty">Не нашли «' + esc(q.trim()) + '». Проверьте написание или выберите регион «Весь мир»</li>';
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      active = -1;
    }
    input.addEventListener('input', render);
    input.addEventListener('focus', function () { if (input.value) render(); });
    input.addEventListener('keydown', function (e) {
      if (list.hidden || !items.length) { if (e.key === 'Escape') close(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); highlight((active + 1) % items.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight((active - 1 + items.length) % items.length); }
      else if (e.key === 'Escape') close();
    });
    list.addEventListener('mousedown', function (e) {
      var li = e.target.closest('.search__item');
      if (!li) return;
      e.preventDefault();
      go(items[+li.getAttribute('data-i')]);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!norm(input.value)) { input.focus(); return; }
      if (!items.length) render();
      if (items.length) go(items[active >= 0 ? active : 0]);
    });
    doc.addEventListener('click', function (e) { if (!form.contains(e.target)) close(); });
  }
  $$('[data-search]').forEach(attachSearch);

  /* ---------- Плавное появление ---------- */
  var io = !reduceMotion && 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          el.classList.add('is-in');
          io.unobserve(el);
          setTimeout(function () { el.style.transitionDelay = ''; }, 1000);
        });
      }, { rootMargin: '0px 0px -8% 0px' })
    : null;
  function reveal(els) {
    if (!io) return;
    els.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 4) * 80 + 'ms';
      io.observe(el);
    });
  }

  /* ---------- Чат поддержки (вёрстка; в рабочей версии — WebSocket к API) ---------- */
  function renderChat() {
    if (doc.body.hasAttribute('data-no-chat')) return;
    var wrap = doc.createElement('div');
    wrap.className = 'chat';
    wrap.innerHTML =
      '<button class="chat-fab" type="button" aria-expanded="false" aria-controls="chat-panel">' + ICON.chat + '<span>Чат поддержки</span></button>' +
      '<section class="chat-panel" id="chat-panel" role="dialog" aria-modal="false" aria-labelledby="chat-title" hidden>' +
        '<header class="chat-panel__head">' +
          '<span class="chat-panel__avas" aria-hidden="true"><i>А</i><i>М</i></span>' +
          '<div><b id="chat-title">Поддержка Привет SIM</b><small>Отвечаем моментально · оператор в течение 5 мин</small></div>' +
          '<button class="icon-btn" type="button" data-chat-close aria-label="Закрыть чат">' + ICON.close + '</button>' +
        '</header>' +
        '<div class="chat-panel__body" aria-live="polite">' +
          '<p class="bubble bubble--bot">Здравствуйте! Оставьте email — по нему мы найдём ваши заказы и eSIM и ответим на почту, даже если вы закроете сайт.</p>' +
          '<form class="chat-start" novalidate>' +
            '<div class="field"><label class="field__label" for="chat-email">Email</label>' +
            '<input class="input" id="chat-email" type="email" inputmode="email" autocomplete="email" placeholder="name@mail.ru">' +
            '<p class="field__error" hidden></p></div>' +
            '<p class="chat-start__label">О чём хотите спросить?</p>' +
            '<div class="chips chips--sm">' +
              ['Не работает интернет', 'Как установить', 'Возврат', 'Оплата'].map(function (t) { return '<button class="chip" type="button" data-topic>' + t + '</button>'; }).join('') +
            '</div>' +
            '<button class="btn btn--primary btn--md btn--block" type="submit">Начать чат</button>' +
            '<p class="chat-start__note">Нажимая «Начать чат», вы соглашаетесь с <a href="legal.html?doc=privacy">обработкой персональных данных</a></p>' +
          '</form>' +
        '</div>' +
        '<form class="chat-panel__input" hidden><label class="sr-only" for="chat-msg">Сообщение</label>' +
          '<input class="input" id="chat-msg" autocomplete="off" placeholder="Напишите сообщение">' +
          '<button class="icon-btn icon-btn--primary" type="submit" aria-label="Отправить">' + ICON.send + '</button></form>' +
      '</section>';
    doc.body.appendChild(wrap);

    var fab = $('.chat-fab', wrap), panel = $('.chat-panel', wrap), body = $('.chat-panel__body', wrap);
    var start = $('.chat-start', wrap), input = $('.chat-panel__input', wrap), topic = '';
    function open(on) {
      panel.hidden = !on;
      fab.setAttribute('aria-expanded', on ? 'true' : 'false');
      doc.documentElement.classList.toggle('chat-open', on);
      if (on) setTimeout(function () { var f = $('input:not([hidden])', panel); if (f && window.innerWidth >= 768) f.focus(); }, 50);
    }
    fab.addEventListener('click', function () { open(panel.hidden); });
    $('[data-chat-close]', wrap).addEventListener('click', function () { open(false); fab.focus(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { open(false); fab.focus(); } });
    $$('[data-topic]', wrap).forEach(function (b) {
      b.addEventListener('click', function () {
        topic = b.textContent;
        $$('[data-topic]', wrap).forEach(function (x) { x.classList.toggle('is-active', x === b); });
      });
    });
    function add(text, who) {
      var p = doc.createElement('p');
      p.className = 'bubble bubble--' + who;
      p.textContent = text;
      body.appendChild(p);
      body.scrollTop = body.scrollHeight;
    }
    function botReply(q) {
      var typing = doc.createElement('p');
      typing.className = 'bubble bubble--bot bubble--typing';
      typing.innerHTML = '<i></i><i></i><i></i><span class="sr-only">Печатает</span>';
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;
      setTimeout(function () {
        typing.remove();
        var t = norm(q);
        var a = /интернет|сеть|не работ|ловит/.test(t) ? 'Проверьте: Настройки → Сотовая связь → Привет SIM → «Роуминг данных» должен быть включён, а для сотовых данных выбрана линия Привет SIM.'
          : /установ|qr/.test(t) ? 'Отсканируйте QR-код из письма камерой телефона, когда будет Wi-Fi. Пошаговая инструкция — на странице «Помощь».'
          : /возврат|вернуть/.test(t) ? 'Если eSIM ещё не установлена, вернём деньги полностью. Напишите номер заказа — оформим.'
          : /оплат|сбп|usdt/.test(t) ? 'Оплатить можно по СБП из приложения любого банка' + (C.payments && C.payments.usdt ? ' или в USDT' : '') + '. Цена в рублях фиксируется до оплаты.'
          : 'Спасибо! Передал вопрос оператору — он подключится в течение 5 минут.';
        add(a, 'bot');
      }, 900);
    }
    start.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = $('#chat-email', wrap);
      var r = checkEmail(em.value);
      fieldError(em, r.error);
      if (r.error) { em.focus(); return; }
      start.remove();
      input.hidden = false;
      add('Здравствуйте! Я ИИ-помощник Привет SIM. Чем помочь? Если понадобится, позову оператора.', 'bot');
      if (topic) { add(topic, 'me'); botReply(topic); }
      $('#chat-msg', wrap).focus();
    });
    input.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = $('#chat-msg', wrap);
      var v = m.value.trim();
      if (!v) return;
      add(v, 'me');
      m.value = '';
      botReply(v);
    });
  }
  renderChat();

  /* ---------- Хлебные крошки ---------- */
  function crumbs(items) {
    return '<nav class="crumbs" aria-label="Навигация"><ol>' + items.map(function (it, i) {
      return '<li>' + (it[1] && i < items.length - 1 ? '<a href="' + it[1] + '">' + esc(it[0]) + '</a>' : '<span aria-current="page">' + esc(it[0]) + '</span>') + '</li>';
    }).join('') + '</ol></nav>';
  }

  window.PS = {
    C: C, $: $, $$: $$, money: money, norm: norm, esc: esc, param: param, plural: plural, days: days,
    flag: flag, url: url, LINKS: LINKS, ICON: ICON, toast: toast, fakeQr: fakeQr, checkEmail: checkEmail,
    fieldError: fieldError, searchDest: searchDest, attachSearch: attachSearch, reveal: reveal, crumbs: crumbs,
    reduceMotion: reduceMotion
  };
})();

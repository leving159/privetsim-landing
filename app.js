(function () {
  'use strict';

  var C = window.SITE_CONFIG || {};
  var DEST = (C.destinations || []).concat(C.more || []);
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FLAGS = ['tr', 'ae', 'th', 'ge', 'eg', 'vn', 'cn', 'am', 'eu', 'jp', 'it', 'es', 'fr', 'gb', 'us', 'cy', 'me', 'kz', 'uz', 'id', 'lk', 'mv', 'in', 'br', 'au', 'nz', 'ru'];

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function money(n) { return new Intl.NumberFormat('ru-RU').format(n) + ' ₽'; }
  function norm(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').trim(); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function byCode(code) { for (var i = 0; i < DEST.length; i++) if (DEST[i].code === code) return DEST[i]; return null; }

  function flagHtml(d, size) {
    if (FLAGS.indexOf(d.code) !== -1) return '<img src="assets/flags/' + d.code + '.svg" alt="" width="' + size + '" height="' + size + '">';
    return '<span class="globe" style="width:' + size + 'px;height:' + size + 'px" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg></span>';
  }

  /* ---------- Ссылки ---------- */
  var tg = function (u, start) { return u ? 'https://t.me/' + u + (start ? '?start=' + start : '') : ''; };

  function buyUrl(code) {
    var d = byCode(code);
    if (C.shopUrl) return C.shopUrl + '/' + ((d && d.path) || 'countries/' + code);
    return tg(C.botUsername, code);
  }

  var LINKS = {
    bot: tg(C.botUsername),
    support: tg(C.supportUsername) || (C.email ? 'mailto:' + C.email : ''),
    all: C.shopUrl || tg(C.botUsername),
    offer: C.offerUrl,
    privacy: C.privacyUrl,
    email: C.email ? 'mailto:' + C.email : ''
  };

  function isExternal(url) { return /^https?:/.test(url); }

  $$('[data-link]').forEach(function (a) {
    var url = LINKS[a.getAttribute('data-link')];
    if (!url) { a.hidden = true; return; }
    a.href = url;
    if (isExternal(url)) { a.target = '_blank'; a.rel = 'noopener'; }
  });

  $$('[data-requires]').forEach(function (el) { if (!LINKS[el.getAttribute('data-requires')]) el.hidden = true; });
  // колонка подвала без единой ссылки не нужна
  $$('.footer nav').forEach(function (nav) { if (!$$('a:not([hidden])', nav).length) nav.hidden = true; });

  function wireBuy(a) {
    var code = a.getAttribute('data-buy');
    var url = buyUrl(code);
    if (url) {
      a.href = url;
      if (isExternal(url)) { a.target = '_blank'; a.rel = 'noopener'; }
    } else {
      // Магазин и бот ещё не подключены — показываем подсказку вместо пустой ссылки
      a.href = '#countries';
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var d = byCode(code);
        toast('Продажи eSIM' + (d ? ' «' + d.name + '»' : '') + ' откроются совсем скоро');
      });
    }
  }

  if (C.seller) {
    var legal = $('[data-seller]');
    if (legal) legal.insertAdjacentText('beforeend', ' · ' + C.seller);
  }
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Тост ---------- */
  var toastEl;
  var toastTimer;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 4000);
  }

  /* ---------- Карточки направлений ---------- */
  var cardsEl = $('[data-cards]');

  function renderCards(type) {
    if (!cardsEl) return;
    var list = (C.destinations || []).filter(function (d) { return (d.type || 'country') === type; });
    cardsEl.innerHTML = list.map(function (d) {
      return (
        '<a class="card" data-buy="' + esc(d.code) + '" href="#">' +
          '<span class="card__media">' +
            '<img src="assets/photos/' + esc(d.photo) + '" alt="' + esc(d.name + ' — ' + d.place) + '" width="640" height="480" loading="lazy" decoding="async">' +
            '<span class="card__badge">' + flagHtml(d, 18) + '<span class="mono">' + esc(d.code.slice(0, 2).toUpperCase()) + '</span></span>' +
            '<span class="card__place"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>' + esc(d.place) + '</span>' +
          '</span>' +
          '<span class="card__body">' +
            '<span class="card__name">' + esc(d.name) + '</span>' +
            '<span class="card__meta mono">от ' + money(d.price) + ' · ' + esc(d.net) + '</span>' +
            '<svg class="card__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>' +
          '</span>' +
        '</a>'
      );
    }).join('');
    $$('[data-buy]', cardsEl).forEach(wireBuy);
    reveal($$('.card', cardsEl));
  }

  $$('[data-buy]').forEach(wireBuy);
  renderCards('country');

  $$('.segment__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.segment__btn').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      renderCards(btn.getAttribute('data-tab'));
    });
  });

  /* ---------- Поиск ---------- */
  function match(q) {
    q = norm(q);
    if (!q) return [];
    var starts = [], has = [];
    DEST.forEach(function (d) {
      var hay = norm(d.name + ' ' + (d.aliases || '') + ' ' + (d.place || ''));
      if (norm(d.name).indexOf(q) === 0) starts.push(d);
      else if (hay.indexOf(q) !== -1) has.push(d);
    });
    return starts.concat(has).slice(0, 6);
  }

  $$('[data-search]').forEach(function (form) {
    var input = $('.search__input', form);
    var list = $('.search__list', form);
    var items = [];
    var active = -1;

    function close() {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      active = -1;
    }

    function go(d) {
      close();
      var url = buyUrl(d.code);
      if (url) {
        if (isExternal(url)) window.open(url, '_blank', 'noopener');
        else location.href = url;
      } else {
        toast('Продажи eSIM «' + d.name + '» откроются совсем скоро');
      }
    }

    function highlight(i) {
      active = i;
      $$('.search__item', list).forEach(function (li, k) { li.classList.toggle('is-active', k === i); li.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      if (i >= 0) input.setAttribute('aria-activedescendant', list.id + '-' + i);
    }

    function render() {
      var q = input.value;
      items = match(q);
      if (!norm(q)) { close(); return; }
      if (!items.length) {
        list.innerHTML = '<li class="search__empty">Не нашли «' + esc(q.trim()) + '». Проверьте написание или выберите регион «Весь мир»</li>';
      } else {
        list.innerHTML = items.map(function (d, i) {
          return '<li class="search__item" role="option" id="' + list.id + '-' + i + '" data-i="' + i + '">' +
            flagHtml(d, 24) + '<span class="search__name">' + esc(d.name) + '</span>' +
            '<span class="search__price mono">от ' + money(d.price) + '</span></li>';
        }).join('');
      }
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
    document.addEventListener('click', function (e) { if (!form.contains(e.target)) close(); });
  });

  /* ---------- Меняющийся город в заголовке ---------- */
  var word = $('.rotator__word');
  if (word && !reduceMotion) {
    var cities = ['Стамбуле', 'Бангкоке', 'Тбилиси', 'Дубае', 'Токио'];
    var ci = 0;
    setInterval(function () {
      word.classList.add('is-out');
      setTimeout(function () {
        ci = (ci + 1) % cities.length;
        word.textContent = cities[ci];
        word.classList.remove('is-out');
      }, 260);
    }, 2600);
  }

  /* ---------- Мобильное меню ---------- */
  var burger = $('.burger');
  var menu = $('#mobile-menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.hidden = !open;
    document.documentElement.classList.toggle('menu-open', open);
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });
    window.matchMedia('(min-width: 960px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* ---------- Тень шапки при прокрутке ---------- */
  var header = $('.header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Вопросы: вкладки ---------- */
  var faqTabs = $$('[data-faq]');
  faqTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var cat = tab.getAttribute('data-faq');
      faqTabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      var first = true;
      $$('.acc details').forEach(function (d) {
        var show = d.getAttribute('data-cat') === cat;
        d.hidden = !show;
        d.open = show && first;
        if (show) first = false;
      });
    });
  });

  /* ---------- Липкая кнопка на телефоне ---------- */
  var sticky = $('.sticky-cta');
  if (sticky && 'IntersectionObserver' in window) {
    var heroVisible = true, finalVisible = false, countriesVisible = false;
    var upd = function () {
      var on = !heroVisible && !finalVisible && !countriesVisible;
      sticky.classList.toggle('is-on', on);
      sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
      $('a', sticky).tabIndex = on ? 0 : -1;
    };
    var watch = function (el, set) {
      if (!el) return;
      new IntersectionObserver(function (en) { set(en[0].isIntersecting); upd(); }).observe(el);
    };
    watch($('.hero .search'), function (v) { heroVisible = v; });
    watch($('#final'), function (v) { finalVisible = v; });
    watch($('#countries .cards'), function (v) { countriesVisible = v; });
  }

  /* ---------- Плавное появление блоков ---------- */
  var io = !reduceMotion && 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          el.classList.add('is-in');
          io.unobserve(el);
          // задержка каскада не должна тормозить наведение потом
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
  reveal($$('.step, .tile, .compare__col, .panel'));
})();

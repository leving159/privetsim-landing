/* Главная: карточки направлений, меняющийся город, вопросы, липкая кнопка */
(function () {
  'use strict';
  var P = window.PS, CAT = window.CATALOG, $ = P.$, $$ = P.$$, esc = P.esc;

  /* ---------- Карточки ---------- */
  var cardsEl = $('[data-cards]');
  function card(d) {
    var photo = CAT.photoOf(d);
    var code = d.type === 'region' ? (d.flag ? d.flag.toUpperCase() : '') : d.code.toUpperCase();
    return '<a class="card" href="' + P.url.country(d.code) + '">' +
      '<span class="card__media">' +
        '<img src="assets/photos/' + esc(photo) + '" alt="' + esc(d.name + (d.place ? ' — ' + d.place : '')) + '" width="640" height="480" loading="lazy" decoding="async">' +
        '<span class="card__badge">' + P.flag(d, 18) + (code ? '<span class="mono">' + esc(code) + '</span>' : '') + '</span>' +
        (d.place ? '<span class="card__place">' + P.ICON.pin + esc(d.place) + '</span>' : '') +
      '</span>' +
      '<span class="card__body">' +
        '<span class="card__name">' + esc(d.name) + '</span>' +
        '<span class="card__meta mono">от ' + P.money(d.price) + ' · ' + esc(d.net) + '</span>' +
        '<svg class="card__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>' +
      '</span></a>';
  }
  function renderCards(type) {
    if (!cardsEl) return;
    var list = type === 'region' ? CAT.regions.slice(0, 4) : CAT.popular.map(CAT.get);
    cardsEl.innerHTML = list.map(card).join('');
    P.reveal($$('.card', cardsEl));
  }
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

  /* ---------- Меняющийся город ---------- */
  var word = $('.rotator__word');
  if (word && !P.reduceMotion) {
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
      document.documentElement.classList.toggle('has-sticky', on);
    };
    var watch = function (el, set) {
      if (!el) return;
      new IntersectionObserver(function (en) { set(en[0].isIntersecting); upd(); }).observe(el);
    };
    watch($('.hero .search'), function (v) { heroVisible = v; });
    watch($('#final'), function (v) { finalVisible = v; });
    watch($('#countries .cards'), function (v) { countriesVisible = v; });
  }

  P.reveal($$('.step, .tile, .compare__col, .panel'));
})();

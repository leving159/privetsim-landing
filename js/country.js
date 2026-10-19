/* Страница страны или региона: выбор тарифа, калькулятор, покрытие, панель покупки */
(function () {
  'use strict';
  var P = window.PS, CAT = window.CATALOG, C = P.C, $ = P.$, $$ = P.$$, esc = P.esc, money = P.money;
  var root = $('[data-root]');
  var code = P.param('c') || 'tr';
  var d = CAT.get(code);

  if (!d) {
    document.title = 'Направление не найдено — Привет SIM';
    root.innerHTML = '<div class="oops"><p class="oops__code">НЕТ ТАКОГО НАПРАВЛЕНИЯ</p><h1>Такой страны нет в&nbsp;каталоге</h1>' +
      '<p>Возможно, она входит в&nbsp;региональный пакет. Найдите её в&nbsp;списке или возьмите eSIM «Весь мир».</p>' +
      '<div class="status__actions"><a class="btn btn--primary btn--lg" href="countries.html">Все страны</a><a class="btn btn--secondary btn--lg" href="country.html?c=world">Весь мир</a></div></div>';
    document.body.classList.remove('page--buybar');
    return;
  }

  var isRegion = d.type === 'region';
  var plans = CAT.plansFor(d);
  var state = { kind: 'fixed', id: 'f5-30', days: 7 };
  var cardTone = isRegion ? d.code : ({ europe: 'europe', asia: 'asia', mideast: 'mideast', america: 'america', oceania: 'america' }[d.part] || '');
  var coverage = isRegion ? d.countries.map(CAT.get).filter(Boolean) : [];
  var nCountries = coverage.length;

  document.title = 'eSIM для ' + d.gen + ' — от ' + money(d.price) + ' · Привет SIM';
  var metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = 'eSIM для ' + d.gen + ': мобильный интернет ' + d.net + ' без роуминга. Пакеты от ' + money(d.price) + ', установка за 2 минуты, оплата по СБП.';

  function current() { return CAT.findPlan(d, state.id, state.days); }

  /* ---------- Разметка ---------- */
  var IC = {
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    sim: '<svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z"/><rect x="10" y="12" width="6" height="6" rx="1"/></svg>',
    wifi: '<svg viewBox="0 0 24 24"><path d="M3 9a14 14 0 0 1 18 0M6.5 12.5a9 9 0 0 1 11 0M10 16a4 4 0 0 1 4 0"/><circle cx="12" cy="19" r="1"/></svg>',
    route: '<svg viewBox="0 0 24 24"><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18c6 0 2-12 8-12"/></svg>'
  };

  var photo = CAT.photoOf(d);
  var lead = isRegion
    ? 'Одна eSIM на ' + (d.code === 'world' ? '100+ стран' : nCountries + ' ' + P.plural(nCountries, 'страну', 'страны', 'стран') + ': ' + coverage.slice(0, 4).map(function (c) { return c.name; }).join(', ') + ' и другие') + '. Пересекли границу — интернет переключится сам, без новых покупок. Установите за день до вылета.'
    : 'Мобильный интернет по всей стране. Установите за день до вылета — подключится сразу после посадки. Ваша SIM-карта остаётся в телефоне.';

  var hero =
    P.crumbs([['Главная', 'index.html'], ['Страны', 'countries.html'], [d.name]]) +
    '<section class="dest-hero">' +
      '<div>' +
        '<div class="dest-hero__meta">' + P.flag(d, 56).replace('class="flag"', 'class="flag dest-hero__flag"') +
          '<span class="badge badge--info badge--plain mono">' + esc(d.net) + '</span>' +
          (isRegion ? '<span class="badge badge--muted badge--plain mono">' + (d.code === 'world' ? '100+' : nCountries) + ' СТРАН</span>' : '') +
        '</div>' +
        '<h1>eSIM для ' + esc(d.gen) + '</h1>' +
        '<p class="dest-hero__lead">' + esc(lead) + '</p>' +
        (isRegion ? '<div class="flags-row" aria-hidden="true">' + coverage.slice(0, 7).map(function (c) { return '<img src="assets/flags/' + c.code + '.svg" alt="">'; }).join('') + '<span>+' + Math.max(0, (d.code === 'world' ? 100 : nCountries) - 7) + ' в одной eSIM</span></div>' : '') +
      '</div>' +
      '<figure class="dest-hero__photo"><img src="assets/photos/' + esc(photo) + '" alt="' + esc(d.name + (d.place ? ' — ' + d.place : '')) + '" width="960" height="720">' +
        '<figcaption>' + (d.place ? '<span class="photo-tag">' + P.ICON.pin + esc(d.place) + '</span>' : '<span></span>') +
        (d.gallery ? '<a class="photo-btn" href="' + P.url.place(d.code) + '">Где это →</a>' : '') +
        '</figcaption></figure>' +
    '</section>';

  var plansSec =
    '<section aria-labelledby="plans-title">' +
      '<h2 id="plans-title">Выберите тариф</h2>' +
      '<div class="segment plan-type" role="tablist" aria-label="Тип тарифа">' +
        '<button class="segment__btn is-active" type="button" role="tab" aria-selected="true" data-kind="fixed">На весь срок</button>' +
        '<button class="segment__btn" type="button" role="tab" aria-selected="false" data-kind="daily">С лимитом в день</button>' +
      '</div>' +
      '<p class="plan-note" data-type-note></p>' +
      '<div class="plans" role="radiogroup" aria-labelledby="plans-title" data-plans></div>' +
      '<div class="days-row" data-days hidden>' +
        '<b id="days-label">Сколько дней</b>' +
        '<div class="stepper" role="group" aria-labelledby="days-label"><button type="button" data-dstep="-1" aria-label="Меньше дней">−</button><output data-dcount>7</output><button type="button" data-dstep="1" aria-label="Больше дней">+</button></div>' +
        '<div class="chips chips--sm">' + [3, 7, 10, 14, 21, 30].map(function (n) { return '<button class="chip" type="button" data-dset="' + n + '">' + P.days(n) + '</button>'; }).join('') + '</div>' +
        '<p class="muted" data-dtotal></p>' +
      '</div>' +
      calcHtml() +
    '</section>';

  function calcHtml() {
    var USES = [['maps', 'Карты и такси', 0.1], ['msg', 'Мессенджеры и звонки', 0.2], ['social', 'Соцсети и фото', 0.5], ['video', 'Видео и стримы', 1.5], ['share', 'Раздача на ноутбук', 1]];
    return '<details class="calc"><summary><span>Не знаете, сколько гигабайт нужно? Ответьте на 2 вопроса — подскажем пакет</span><b>Подобрать</b></summary>' +
      '<div class="calc__body">' +
        '<div><p class="calc__q">1. Сколько дней в поездке</p><div class="chips chips--sm" data-calc-days>' +
          [[3, 'До 3 дней'], [7, 'Неделя'], [14, 'Две недели'], [30, 'Месяц']].map(function (x, i) { return '<button class="chip' + (i === 1 ? ' is-active' : '') + '" type="button" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') +
        '</div></div>' +
        '<div><p class="calc__q">2. Чем будете пользоваться</p><div class="chips chips--sm" data-calc-use>' +
          USES.map(function (u, i) { return '<button class="chip' + (i < 2 ? ' is-active' : '') + '" type="button" aria-pressed="' + (i < 2) + '" data-v="' + u[2] + '">' + u[1] + '</button>'; }).join('') +
        '</div></div>' +
        '<div class="calc__result"><span data-calc-out></span><button class="btn btn--primary btn--md" type="button" data-calc-pick>Выбрать</button></div>' +
      '</div></details>';
  }

  var coverSec = isRegion ?
    '<section aria-labelledby="cover-title"><h2 id="cover-title">Страны в пакете</h2>' +
      '<form class="search cover-search" role="search" onsubmit="return false"><label class="sr-only" for="cover-q">Найти страну в пакете</label>' +
        '<svg class="search__icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
        '<input class="search__input" id="cover-q" type="search" placeholder="Найти страну в пакете" autocomplete="off"></form>' +
      '<ul class="cover" data-cover></ul>' +
      '<p class="muted small" data-cover-empty hidden>Такой страны в&nbsp;пакете нет. Поищите в&nbsp;<a class="link" href="countries.html">каталоге</a>: возможно, для неё есть отдельная eSIM.</p>' +
      (d.code !== 'world' ? '<div class="info-box" style="margin-top:14px">Едете только в&nbsp;одну страну? Отдельная eSIM страны обычно дешевле региональной. <a class="link" href="countries.html?part=' + (d.code === 'europe' ? 'europe' : d.code) + '">Выбрать страну</a></div>' : '') +
    '</section>' : '';

  var where = isRegion ? 'в любой стране пакета' : 'в стране поездки';
  var notesSec =
    '<section aria-labelledby="notes-title"><h2 id="notes-title">Что важно знать</h2><div class="notes">' +
      note(IC.clock, 'Срок — с первого подключения', 'Дни считаются, когда телефон впервые поймает сеть ' + where + '.') +
      note(IC.plus, 'Можно пополнить', 'Докупите гигабайты на ту же eSIM в боте или личном кабинете.') +
      (isRegion ? note(IC.route, 'Без смены настроек', 'Пересекли границу — eSIM сама подключится к местной сети.') : note(IC.sim, 'Ваша SIM остаётся', 'SMS и звонки на основной номер работают как обычно.')) +
      note(IC.wifi, 'Раздача интернета', 'Можно раздавать интернет на ноутбук и другие устройства.') +
    '</div></section>';
  function note(icon, t, p) { return '<div class="note"><span class="note__icon" aria-hidden="true">' + icon + '</span><div><b>' + t + '</b><p>' + p + '</p></div></div>'; }

  var techSec =
    '<section aria-labelledby="tech-title"><h2 id="tech-title">Технические детали</h2><dl class="kv tech">' +
      kv('Покрытие', isRegion ? (d.code === 'world' ? '100+ стран' : nCountries + ' ' + P.plural(nCountries, 'страна', 'страны', 'стран')) : d.name) +
      kv('Сеть', d.net.replace('/', ' / ')) +
      kv('Операторы', isRegion ? 'по стране, выбор автоматически' : 'местные, выбор автоматически') +
      kv('Тип', 'Только интернет, без номера') +
      kv('Настройка APN', 'Автоматически') +
      kv('Раздача по Wi-Fi', 'Да') +
    '</dl></section>';
  function kv(k, v) { return '<div><dt>' + k + '</dt><dd>' + esc(v) + '</dd></div>'; }

  var installSec =
    '<section aria-labelledby="inst-title"><h2 id="inst-title">Как подключиться</h2><ol class="isteps">' +
      '<li><b>Оплатите пакет</b><p>QR-код и инструкция придут на email сразу после оплаты.</p></li>' +
      '<li><b>Установите eSIM накануне вылета</b><p>Пока есть Wi-Fi: отсканируйте QR-код — около 2 минут.</p></li>' +
      '<li><b>Включите «Роуминг данных» после посадки</b><p>Для линии Привет SIM — и интернет заработает.</p></li>' +
    '</ol><p style="margin-top:16px" class="row"><a class="link" href="help.html#install">Подробная инструкция</a><a class="link" href="compatibility.html">Подходит ли мой телефон</a></p></section>';

  var related = isRegion
    ? coverage.filter(function (c) { return c.popular; }).concat(coverage.filter(function (c) { return !c.popular; })).slice(0, 6)
    : CAT.regions.filter(function (r) { return r.code !== 'world' && r.countries.indexOf(d.code) !== -1; })
        .concat(CAT.countries.filter(function (c) { return c.part === d.part && c.code !== d.code; }).slice(0, 5));
  var relSec = related.length ?
    '<section aria-labelledby="rel-title"><h2 id="rel-title">' + (isRegion ? 'Отдельные eSIM стран' : 'Похожие направления') + '</h2><div class="clist">' +
      related.map(function (c) {
        return '<a class="citem" href="' + P.url.country(c.code) + '">' + P.flag(c, 36) + '<span><b>' + esc(c.name) + '</b><small>' + (c.type === 'region' ? 'Регион · ' + c.countries.length + ' стран' : esc(c.net)) + '</small></span><span class="mono">от ' + money(c.price) + '</span></a>';
      }).join('') + '</div></section>' : '';

  var buy =
    '<aside class="buy" aria-label="Ваш выбор">' +
      '<div class="esim-card' + (cardTone ? ' esim-card--' + cardTone : '') + '" aria-hidden="true">' +
        '<div class="esim-card__top"><span>Привет SIM</span><span class="esim-card__chip"></span></div>' +
        '<div><div class="esim-card__name">' + P.flag(d, 24) + esc(isRegion ? d.name + (d.code === 'world' ? '' : ' · ' + nCountries + ' стран') : d.name) + '</div>' +
        '<div class="esim-card__data" data-card-data></div></div>' +
      '</div>' +
      '<dl class="kv"><div><dt>Пакет</dt><dd data-sum-pkg></dd></div><div><dt>Срок</dt><dd data-sum-days></dd></div><div><dt>Сеть</dt><dd>' + esc(d.net) + ' · только интернет</dd></div></dl>' +
      '<div class="buy__total"><span>Итого</span><b data-sum-total></b></div>' +
      '<a class="btn btn--primary btn--lg btn--block" data-buy-link href="#">Перейти к оплате <span aria-hidden="true">→</span></a>' +
      '<p class="buy__hint">Оплата по СБП' + (C.payments && C.payments.usdt ? ' или в USDT' : '') + '. <a href="compatibility.html">Проверить телефон</a></p>' +
    '</aside>';

  root.innerHTML = hero +
    '<div class="dest-layout"><div class="dest-main">' + plansSec + coverSec + notesSec + techSec + installSec + relSec + '</div><div>' + buy + '</div></div>';

  var bar = document.createElement('div');
  bar.className = 'buybar';
  bar.innerHTML = '<div><small data-bar-sum></small><b data-bar-total></b></div><a class="btn btn--primary btn--md" data-buy-link href="#">К оплате <span aria-hidden="true">→</span></a>';
  document.body.appendChild(bar);

  /* ---------- Логика выбора ---------- */
  var plansEl = $('[data-plans]');
  function planCard(p, selected) {
    var big = p.kind === 'fixed' ? p.gb + ' ГБ' : p.gb + ' ГБ/день';
    var small = p.kind === 'fixed' ? P.days(p.days) : 'на любое число дней';
    var price = p.kind === 'fixed' ? money(p.price) : money(p.perDay) + '/день';
    return '<button class="plan" type="button" role="radio" aria-checked="' + selected + '" data-plan="' + p.id + '">' +
      (p.hit ? '<span class="badge badge--hit badge--plain">Хит</span>' : '') +
      '<span class="plan__big">' + big + '</span><span class="plan__small">' + small + '</span><span class="plan__price">' + price + '</span></button>';
  }

  function render() {
    var list = plans[state.kind];
    plansEl.innerHTML = list.map(function (p) { return planCard(p, p.id === state.id); }).join('');
    $$('[data-kind]').forEach(function (b) {
      var on = b.getAttribute('data-kind') === state.kind;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $('[data-type-note]').textContent = state.kind === 'fixed'
      ? 'Гигабайты на всю поездку — тратьте в любом темпе.'
      : 'Лимит обновляется каждые сутки. После лимита скорость снижается до следующего дня, точные условия — в описании пакета.';
    $('[data-days]').hidden = state.kind !== 'daily';
    $('[data-dcount]').textContent = state.days;
    $$('[data-dset]').forEach(function (b) { b.classList.toggle('is-active', +b.getAttribute('data-dset') === state.days); });
    $('[data-dstep="-1"]').disabled = state.days <= 1;
    $('[data-dstep="1"]').disabled = state.days >= 30;

    var p = current();
    if (state.kind === 'daily') $('[data-dtotal]').textContent = 'До ' + p.gb * p.days + ' ГБ за поездку · ' + money(p.perDay) + ' × ' + P.days(p.days);
    var pkg = p.kind === 'fixed' ? p.gb + ' ГБ' : p.gb + ' ГБ в день';
    $('[data-sum-pkg]').textContent = pkg;
    $('[data-sum-days]').textContent = P.days(p.days);
    $('[data-sum-total]').textContent = money(p.price);
    $('[data-card-data]').textContent = 'eSIM · ' + (p.kind === 'fixed' ? p.gb + ' ГБ' : p.gb + ' ГБ/день') + ' · ' + p.days + ' дн';
    $('[data-bar-sum]').textContent = d.name + ' · ' + pkg + ' · ' + P.days(p.days);
    $('[data-bar-total]').textContent = money(p.price);
    var href = P.url.checkout(d.code, p.id, p.kind === 'daily' ? p.days : 0);
    $$('[data-buy-link]').forEach(function (a) { a.href = href; });
  }

  plansEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-plan]');
    if (!b) return;
    state.id = b.getAttribute('data-plan');
    render();
  });
  plansEl.addEventListener('keydown', function (e) {
    var k = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!k) return;
    e.preventDefault();
    var list = plans[state.kind];
    var i = list.map(function (p) { return p.id; }).indexOf(state.id);
    state.id = list[(i + k + list.length) % list.length].id;
    render();
    $('[aria-checked="true"]', plansEl).focus();
  });
  $$('[data-kind]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.kind = b.getAttribute('data-kind');
      var hit = plans[state.kind].filter(function (p) { return p.hit; })[0] || plans[state.kind][0];
      state.id = hit.id;
      render();
    });
  });
  $$('[data-dstep]').forEach(function (b) {
    b.addEventListener('click', function () { state.days = Math.min(30, Math.max(1, state.days + +b.getAttribute('data-dstep'))); render(); });
  });
  $$('[data-dset]').forEach(function (b) {
    b.addEventListener('click', function () { state.days = +b.getAttribute('data-dset'); render(); });
  });

  /* ---------- Калькулятор ---------- */
  var calcDays = 7, rec = null;
  function calc() {
    var perDay = $$('[data-calc-use] .is-active').reduce(function (s, b) { return s + +b.getAttribute('data-v'); }, 0) || 0.1;
    var need = Math.max(1, Math.ceil(perDay * calcDays * 1.15));
    rec = plans.fixed.filter(function (p) { return p.gb >= need && p.days >= calcDays; })[0];
    var out = $('[data-calc-out]');
    if (rec) {
      out.innerHTML = 'Нужно примерно <b>' + need + ' ГБ</b> · советуем <b>' + rec.gb + ' ГБ на ' + P.days(rec.days) + '</b>';
    } else {
      var daily = plans.daily.filter(function (p) { return p.gb * calcDays >= need; })[0] || plans.daily[plans.daily.length - 1];
      rec = { id: daily.id, kind: 'daily', gb: daily.gb };
      out.innerHTML = 'Нужно примерно <b>' + need + ' ГБ</b> · советуем <b>' + daily.gb + ' ГБ в день</b>';
    }
  }
  $('[data-calc-days]').addEventListener('click', function (e) {
    var b = e.target.closest('[data-v]');
    if (!b) return;
    calcDays = +b.getAttribute('data-v');
    $$('[data-calc-days] .chip').forEach(function (x) { x.classList.toggle('is-active', x === b); });
    calc();
  });
  $('[data-calc-use]').addEventListener('click', function (e) {
    var b = e.target.closest('[data-v]');
    if (!b) return;
    var on = !b.classList.contains('is-active');
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', on);
    calc();
  });
  $('[data-calc-pick]').addEventListener('click', function () {
    state.kind = rec.kind;
    state.id = rec.id;
    if (rec.kind === 'daily') state.days = Math.min(30, calcDays);
    render();
    $('.calc').open = false;
    plansEl.scrollIntoView({ behavior: P.reduceMotion ? 'auto' : 'smooth', block: 'center' });
    P.toast('Выбрали подходящий пакет');
  });
  calc();

  /* ---------- Покрытие региона ---------- */
  if (isRegion) {
    var coverEl = $('[data-cover]');
    var renderCover = function () {
      var q = P.norm($('#cover-q').value);
      var list = coverage.filter(function (c) { return !q || P.norm(c.name + ' ' + c.aliases).indexOf(q) !== -1; });
      coverEl.innerHTML = list.map(function (c) {
        return '<li>' + P.flag(c, 28) + '<span>' + esc(c.name) + '<small>местный оператор</small></span><span class="mono">' + esc(c.net) + '</span></li>';
      }).join('');
      $('[data-cover-empty]').hidden = !!list.length;
    };
    $('#cover-q').addEventListener('input', renderCover);
    renderCover();
  }

  render();
  P.reveal($$('.note, .citem'));
})();

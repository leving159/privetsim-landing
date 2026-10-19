/* «Где это»: галерея, описание места, как добраться, связь и eSIM */
(function () {
  'use strict';
  var P = window.PS, CAT = window.CATALOG, $ = P.$, $$ = P.$$, esc = P.esc;
  var root = $('[data-root]');
  var code = P.param('c') || 'tr';
  var d = CAT.get(code), pl = (window.PLACES || {})[code];

  if (!d || !pl) {
    root.innerHTML = '<div class="oops"><p class="oops__code">МЕСТО НЕ НАЙДЕНО</p><h1>Об этом месте пока не&nbsp;рассказали</h1><p>Зато eSIM для поездки уже есть.</p>' +
      '<div class="status__actions"><a class="btn btn--primary btn--lg" href="' + (d ? P.url.country(d.code) : 'countries.html') + '">Выбрать eSIM</a></div></div>';
    return;
  }
  document.title = pl.title + ' — где это и как добраться · Привет SIM';

  var photos = [];
  for (var i = 1; i <= d.gallery; i++) photos.push({ src: 'assets/photos/' + d.code + (i === 1 ? '' : '-' + i) + '.jpg', cap: pl.gallery[i - 1] || pl.title });

  root.innerHTML =
    P.crumbs([['Главная', 'index.html'], [d.name, P.url.country(d.code)], [pl.title]]) +
    '<header class="page-head"><p class="label" style="margin-top:0">' + P.flag(d, 18) + esc(d.name) + '</p><h1>' + esc(pl.title) + '</h1><p>' + esc(pl.where) + '</p></header>' +
    '<div class="dest-layout"><div class="dest-main">' +
      '<section class="gallery" aria-label="Галерея">' +
        '<figure class="gallery__main"><img data-g-img src="' + photos[0].src + '" alt="' + esc(photos[0].cap) + '" width="960" height="720">' +
          '<span class="photo-tag gallery__count" data-g-count></span>' +
          (photos.length > 1 ? '<div class="gallery__nav"><button type="button" data-g="-1" aria-label="Предыдущее фото">←</button><button type="button" data-g="1" aria-label="Следующее фото">→</button></div>' : '') +
        '</figure>' +
        '<p class="small muted" data-g-cap></p>' +
        (photos.length > 1 ? '<div class="gallery__thumbs">' + photos.map(function (p, k) {
          return '<button type="button" data-g-to="' + k + '" aria-label="Фото ' + (k + 1) + ': ' + esc(p.cap) + '"><img src="' + p.src + '" alt="" loading="lazy" width="160" height="120"></button>';
        }).join('') + '</div>' : '') +
      '</section>' +
      '<section><h2>Что это за место</h2><p class="doc__intro mt-0">' + esc(pl.about) + '</p></section>' +
      '<section><h2>Чем заняться</h2><ul class="todo">' + pl.todo.map(function (t) {
        return '<li><span class="label">' + esc(t[0]) + '</span><b>' + esc(t[1]) + '</b><p>' + esc(t[2]) + '</p></li>';
      }).join('') + '</ul></section>' +
      '<section><h2>Как добраться</h2><p class="doc__intro mt-0">' + esc(pl.how) + '</p><p class="small muted" style="margin-top:8px">Время в пути примерное — проверьте расписание перед поездкой.</p></section>' +
      '<section class="facts-3">' +
        '<div><b>Когда ехать</b><p>' + esc(pl.when) + '</p></div>' +
        '<div><b>Связь на месте</b><p>' + esc(pl.net) + '</p></div>' +
        '<div><b>Совет путешественнику</b><p>' + esc(pl.tip) + '</p></div>' +
      '</section>' +
      '<p class="small muted">Правила въезда меняются — проверьте их перед поездкой.</p>' +
    '</div>' +
    '<div><aside class="buy" aria-label="eSIM для поездки">' +
      '<p class="label">eSIM · ' + esc(d.name) + '</p>' +
      '<p><b style="font-size:28px;letter-spacing:-.02em">от ' + P.money(d.price) + '</b> <span class="muted mono">· ' + esc(d.net) + '</span></p>' +
      '<ul class="check-list"><li>Установите за день до вылета — заработает после посадки</li><li>Основной номер и SMS от банка остаются</li><li>Пополнение без новой eSIM</li></ul>' +
      '<a class="btn btn--primary btn--lg btn--block" href="' + P.url.country(d.code) + '">Выбрать пакет <span aria-hidden="true">→</span></a>' +
      '<a class="btn btn--secondary btn--md btn--block" href="compatibility.html">Проверить телефон</a>' +
    '</aside></div></div>';

  var idx = 0;
  function show(n) {
    idx = (n + photos.length) % photos.length;
    var img = $('[data-g-img]');
    img.src = photos[idx].src;
    img.alt = photos[idx].cap;
    $('[data-g-count]').textContent = (idx + 1) + ' / ' + photos.length;
    $('[data-g-cap]').textContent = photos[idx].cap;
    $$('[data-g-to]').forEach(function (b, k) { b.setAttribute('aria-current', k === idx ? 'true' : 'false'); });
  }
  $$('[data-g]').forEach(function (b) { b.addEventListener('click', function () { show(idx + +b.getAttribute('data-g')); }); });
  $$('[data-g-to]').forEach(function (b) { b.addEventListener('click', function () { show(+b.getAttribute('data-g-to')); }); });
  var main = $('.gallery__main'), x0 = null;
  main.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  main.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  show(0);
})();

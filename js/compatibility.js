/* Совместимость: поиск модели и список устройств по брендам */
(function () {
  'use strict';
  var P = window.PS, CAT = window.CATALOG, $ = P.$, $$ = P.$$, esc = P.esc;
  var DEV = CAT.devices;
  var flat = [];
  Object.keys(DEV).forEach(function (brand) {
    DEV[brand].forEach(function (m) {
      // «iPhone 15, 15 Plus» → отдельные модели для поиска
      var names = m[0].split(/,\s*(?![^(]*\))/); // запятые внутри скобок не делят
      var prefix = names[0].split(' ').slice(0, -1).join(' '); // «Galaxy A55» → «Galaxy»
      names.forEach(function (n, i) {
        var first = prefix.split(' ')[0];
        var full = i && prefix && n.indexOf(first) !== 0 ? prefix + ' ' + n : n;
        flat.push({ name: full.replace(/ и (новее|младше|старше)| \(все.*\)/, ''), group: m[0], s: m[1], brand: brand });
      });
    });
  });

  var TEXT = {
    y: ['поддерживает eSIM', 'Убедитесь, что телефон не привязан к оператору. Модели для материкового Китая обычно без eSIM.', 'compat-result--y'],
    n: ['не поддерживает eSIM', 'eSIM можно установить на другой телефон или планшет и раздавать интернет по Wi-Fi.', 'compat-result--n'],
    v: ['— зависит от версии', 'У этой модели есть версии с eSIM и без. Наберите *#06# — если видите строку EID, всё в порядке.', 'compat-result--v']
  };

  var input = $('#model'), list = $('#model-list'), out = $('[data-result]');
  var items = [], active = -1;

  function result(m) {
    var t = TEXT[m.s];
    out.innerHTML = '<div class="compat-result ' + t[2] + '"><span class="dot3 dot3--' + m.s + '" aria-hidden="true"></span><div>' +
      '<b>' + esc(m.name) + ' ' + t[0] + '</b><p>' + t[1] + '</p>' +
      (m.s !== 'n' ? '<a class="btn btn--primary btn--md" href="countries.html">Выбрать страну <span aria-hidden="true">→</span></a>' : '') + '</div></div>';
  }
  function unknown(q) {
    out.innerHTML = '<div class="compat-result compat-result--u"><span class="dot3" style="background:var(--ink-400)" aria-hidden="true"></span><div>' +
      '<b>Не знаем модель «' + esc(q) + '»</b><p>Проверьте через *#06#' + (P.LINKS.support ? ' или <a class="link" href="' + P.LINKS.support + '" target="_blank" rel="noopener">напишите нам</a>: ответим моментально.' : '.') + '</p></div></div>';
  }
  function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; }
  function render() {
    var q = P.norm(input.value);
    if (!q) { close(); out.innerHTML = ''; return; }
    items = flat.filter(function (m) { return P.norm(m.name).indexOf(q) !== -1 || P.norm(m.brand + ' ' + m.name).indexOf(q) !== -1; }).slice(0, 8);
    if (!items.length) { close(); unknown(input.value.trim()); return; }
    out.innerHTML = '';
    list.innerHTML = items.map(function (m, i) {
      return '<li class="search__item" role="option" id="model-' + i + '" data-i="' + i + '"><span class="dot3 dot3--' + m.s + '" style="margin:0" aria-hidden="true"></span><span class="search__name">' + esc(m.name) + '</span><span class="search__price">' + esc(m.brand) + '</span></li>';
    }).join('');
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }
  function pick(m) { input.value = m.name; close(); result(m); }

  input.addEventListener('input', render);
  input.addEventListener('keydown', function (e) {
    if (list.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      $$('.search__item', list).forEach(function (li, k) { li.classList.toggle('is-active', k === active); });
      input.setAttribute('aria-activedescendant', 'model-' + active);
    } else if (e.key === 'Enter') { e.preventDefault(); pick(items[active >= 0 ? active : 0]); }
    else if (e.key === 'Escape') close();
  });
  list.addEventListener('mousedown', function (e) {
    var li = e.target.closest('.search__item');
    if (li) { e.preventDefault(); pick(items[+li.getAttribute('data-i')]); }
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('[data-check]')) close(); });

  /* Список по брендам */
  var brands = Object.keys(DEV), cur = brands[0];
  var tabsEl = $('[data-brands]');
  tabsEl.innerHTML = brands.map(function (b) { return '<button class="chip" type="button" role="tab" data-b="' + esc(b) + '">' + esc(b) + '</button>'; }).join('');
  function renderList() {
    $$('[data-b]', tabsEl).forEach(function (t) { var on = t.getAttribute('data-b') === cur; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); });
    $('[data-devices]').innerHTML = DEV[cur].map(function (m) {
      return '<li><span class="dot3 dot3--' + m[1] + '" aria-hidden="true"></span><span>' + esc(m[0]) + '</span><small>' + ({ y: 'Да', n: 'Нет', v: 'Зависит от версии' })[m[1]] + '</small></li>';
    }).join('');
  }
  tabsEl.addEventListener('click', function (e) { var b = e.target.closest('[data-b]'); if (b) { cur = b.getAttribute('data-b'); renderList(); } });
  renderList();
})();

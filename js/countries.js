/* Каталог: поиск, фильтр по части света, региональные пакеты */
(function () {
  'use strict';
  var P = window.PS, CAT = window.CATALOG, $ = P.$, $$ = P.$$, esc = P.esc;

  var input = $('#q'), listEl = $('[data-list]'), countEl = $('[data-count]'), emptyEl = $('[data-empty]');
  var packsEl = $('[data-packs]'), partsEl = $('[data-parts]'), resetBtn = $('[data-reset]');
  var part = new URLSearchParams(location.search).get('part') || 'all';

  $('[data-count-all]').textContent = '190+';

  var tabs = [{ id: 'all', name: 'Все', n: CAT.countries.length }].concat(CAT.parts.map(function (p) {
    return { id: p.id, name: p.name, n: CAT.countries.filter(function (c) { return c.part === p.id; }).length };
  }));
  partsEl.innerHTML = tabs.map(function (t) {
    return '<button class="chip" type="button" role="tab" data-part="' + t.id + '">' + esc(t.name) + ' <small>' + t.n + '</small></button>';
  }).join('');

  packsEl.innerHTML = CAT.regions.map(function (r) {
    return '<a class="pack esim-card--' + r.code + '" href="' + P.url.country(r.code) + '">' +
      '<b>' + esc(r.name) + '</b><small>' + (r.code === 'world' ? '100+ стран' : r.countries.length + ' ' + P.plural(r.countries.length, 'страна', 'страны', 'стран')) + ' в одной eSIM</small>' +
      '<span class="mono">от ' + P.money(r.price) + ' →</span></a>';
  }).join('');

  function render() {
    var q = P.norm(input.value);
    resetBtn.hidden = !q;
    $$('[data-part]', partsEl).forEach(function (b) {
      var on = b.getAttribute('data-part') === part;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var list = CAT.countries.filter(function (c) {
      if (part !== 'all' && c.part !== part) return false;
      if (!q) return true;
      return P.norm(c.name + ' ' + c.aliases).indexOf(q) !== -1;
    }).sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });

    listEl.innerHTML = list.map(function (c) {
      var partName = (CAT.parts.filter(function (p) { return p.id === c.part; })[0] || {}).name;
      return '<a class="citem" href="' + P.url.country(c.code) + '">' + P.flag(c, 36) +
        '<span><b>' + esc(c.name) + '</b><small>' + esc(partName) + ' · ' + esc(c.net) + '</small></span>' +
        '<span class="mono">от ' + P.money(c.price) + '</span></a>';
    }).join('');
    countEl.textContent = 'Найдено: ' + list.length;
    countEl.hidden = !list.length;
    emptyEl.hidden = !!list.length;
    $('[data-q]').textContent = input.value.trim();
    $('[data-packs-wrap]').hidden = !!q;
  }

  partsEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-part]');
    if (!b) return;
    part = b.getAttribute('data-part');
    render();
  });
  input.addEventListener('input', render);
  $('[data-filter-form]').addEventListener('submit', function (e) { e.preventDefault(); });
  $('[data-filter-form]').addEventListener('reset', function () { setTimeout(function () { render(); input.focus(); }, 0); });
  $('[data-show-regions]').addEventListener('click', function () {
    input.value = '';
    part = 'all';
    render();
    packsEl.scrollIntoView({ behavior: P.reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });

  render();
})();

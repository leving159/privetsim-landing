/* Документы: оферта, конфиденциальность, возврат, реквизиты */
(function () {
  'use strict';
  var P = window.PS, C = P.C, $ = P.$, esc = P.esc;
  var DOCS = window.LEGAL_DOCS || {};
  var s = C.seller || {};
  var VALUES = {
    'seller.name': s.name || '[Наименование продавца: ИП / ООО]',
    'seller.inn': s.inn || '[ИНН]',
    'seller.ogrn': s.ogrn || '[ОГРН / ОГРНИП]',
    'seller.address': s.address || '[Адрес]',
    'seller.email': C.email || '[почта для обращений]',
    site: location.origin + location.pathname.replace(/[^/]*$/, '')
  };
  var fill = function (t) { return esc(t).replace(/\{\{([\w.]+)\}\}/g, function (_, k) { return esc(VALUES[k] || ''); }); };

  DOCS.requisites = {
    title: 'Реквизиты',
    sections: [{ h: 'Продавец', p: ['{{seller.name}}', 'ИНН: {{seller.inn}}', 'ОГРН/ОГРНИП: {{seller.ogrn}}', 'Адрес: {{seller.address}}', 'Почта: {{seller.email}}'] }]
  };
  var ORDER = [['offer', 'Публичная оферта'], ['privacy', 'Конфиденциальность'], ['refund', 'Возврат'], ['requisites', 'Реквизиты']];
  var id = P.param('doc');
  if (!DOCS[id]) id = 'offer';
  var doc = DOCS[id];
  document.title = doc.title + ' — Привет SIM';

  $('[data-nav]').innerHTML = ORDER.map(function (o) {
    return '<a href="legal.html?doc=' + o[0] + '"' + (o[0] === id ? ' aria-current="page"' : '') + '>' + o[1] + '</a>';
  }).join('');

  var missing = !s.name || !s.inn;
  $('[data-doc]').innerHTML =
    '<h1>' + esc(doc.title) + '</h1>' +
    (doc.updated ? '<p class="doc__date">Редакция от ' + esc(doc.updated) + '</p>' : '') +
    (missing ? '<p class="warn-box doc__draft">Черновик: реквизиты продавца ещё не заполнены, текст должен проверить юрист.</p>' : '') +
    (doc.intro ? '<p class="doc__intro">' + fill(doc.intro) + '</p>' : '') +
    doc.sections.map(function (sec) {
      return '<h2>' + fill(sec.h) + '</h2>' + sec.p.map(function (p) { return '<p>' + fill(p) + '</p>'; }).join('');
    }).join('');

  var cur = $('[data-nav] [aria-current]');
  if (cur && cur.scrollIntoView && window.innerWidth < 960) cur.scrollIntoView({ inline: 'center', block: 'nearest' });
})();

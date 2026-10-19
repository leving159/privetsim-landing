/* Помощь: поиск по вопросам, фильтр по темам, переход по разделам */
(function () {
  'use strict';
  var P = window.PS, $ = P.$, $$ = P.$$;
  var items = $$('[data-faq] details'), tabs = $$('[data-faq-tabs] [data-cat]'), q = $('#hq'), cat = 'all';

  function apply() {
    var s = P.norm(q.value), shown = 0;
    items.forEach(function (d) {
      var ok = (cat === 'all' || d.getAttribute('data-cat') === cat) && (!s || P.norm(d.textContent).indexOf(s) !== -1);
      d.hidden = !ok;
      if (ok) shown++;
      if (s && ok) d.open = true;
    });
    $('[data-faq-empty]').hidden = !!shown;
    tabs.forEach(function (t) { var on = t.getAttribute('data-cat') === cat; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); });
  }
  function setCat(c) { cat = c; apply(); }

  tabs.forEach(function (t) { t.addEventListener('click', function () { setCat(t.getAttribute('data-cat')); }); });
  q.addEventListener('input', function () {
    if (q.value) { cat = 'all'; }
    apply();
    if (q.value.length === 2) $('#faq').scrollIntoView({ behavior: P.reduceMotion ? 'auto' : 'smooth' });
  });
  $$('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function () {
      var c = b.getAttribute('data-goto');
      if (c === 'install') { $('#install').scrollIntoView({ behavior: P.reduceMotion ? 'auto' : 'smooth' }); return; }
      setCat(c);
      $('#faq').scrollIntoView({ behavior: P.reduceMotion ? 'auto' : 'smooth' });
    });
  });
  var chatBtn = $('[data-open-chat]');
  if (chatBtn) chatBtn.addEventListener('click', function () { var f = $('.chat-fab'); if (f) f.click(); });

  // На Android сразу показываем инструкцию для Android
  if (/Android/.test(navigator.userAgent)) { var t = $$('[data-tabs="os"] [role="tab"]')[1]; if (t) t.click(); }
  apply();
})();

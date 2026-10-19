/* Бизнесу: выбор типа партнёра, заявка (вёрстка — без отправки на сервер) */
(function () {
  'use strict';
  var P = window.PS, $ = P.$, $$ = P.$$;
  var form = $('[data-lead]');

  function pick(group, btn, attr) {
    $$('.chip', group).forEach(function (c) { var on = c === btn; c.classList.toggle('is-active', on); c.setAttribute(attr, on); });
  }
  var who = $('[data-who-group]');
  who.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) pick(who, b, 'aria-checked'); });
  var vol = $('[data-vol]');
  vol.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) pick(vol, b, 'aria-pressed'); });
  $$('a[data-who]').forEach(function (a) {
    a.addEventListener('click', function () {
      var b = $('[data-v="' + a.getAttribute('data-who') + '"]', who);
      if (b) pick(who, b, 'aria-checked');
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#l-name'), contact = $('#l-contact');
    var nErr = name.value.trim() ? '' : 'Укажите имя';
    var c = contact.value.trim();
    var cErr = !c ? 'Укажите email или Telegram для связи' : (/@.+\./.test(c) || /^@?[a-zA-Z0-9_]{4,}$/.test(c)) ? '' : 'Похоже, в контакте ошибка. Пример: name@mail.ru или @username';
    P.fieldError(name, nErr);
    P.fieldError(contact, cErr);
    if (nErr || cErr) { (nErr ? name : contact).focus(); return; }
    form.innerHTML = '<div class="status" style="margin:0"><span class="status__icon status__icon--ok" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg></span>' +
      '<h3 tabindex="-1">Заявка отправлена</h3><p>Менеджер свяжется с вами в течение рабочего дня по указанному контакту.</p></div>';
    $('h3', form).focus();
  });
})();

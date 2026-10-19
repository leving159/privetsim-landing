/* Вход по коду из письма (вёрстка: код для демо — 123456) */
(function () {
  'use strict';
  var P = window.PS, C = P.C, $ = P.$, $$ = P.$$, esc = P.esc;
  var steps = { email: $('[data-step="email"]'), code: $('[data-step="code"]'), done: $('[data-step="done"]') };
  var email = $('#email'), ref = $('#ref'), refOk = false, timer;

  function go(name) {
    Object.keys(steps).forEach(function (k) { steps[k].hidden = k !== name; });
    var h = $('h1', steps[name]);
    if (h) { h.tabIndex = -1; h.focus(); }
  }

  // Код друга из ссылки ?ref=
  var fromLink = P.param('ref');
  if (fromLink) { ref.value = fromLink.toUpperCase(); $('[data-ref]').open = true; }

  function checkEmail(show) {
    var r = P.checkEmail(email.value);
    if (show) P.fieldError(email, r.error);
    var sug = $('[data-suggest]');
    if (r.suggest) {
      sug.innerHTML = 'Возможно, вы имели в виду <button type="button">' + esc(r.suggest) + '</button>?';
      sug.hidden = false;
      $('button', sug).onclick = function () { email.value = r.suggest; sug.hidden = true; checkEmail(true); };
    } else sug.hidden = true;
    return !r.error;
  }
  email.addEventListener('blur', function () { if (email.value) checkEmail(true); });

  steps.email.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = checkEmail(true);
    var r = ref.value.trim().toUpperCase();
    refOk = false;
    if (r) {
      if (C.demo && r !== 'PRIVET-7K2Q') { P.fieldError(ref, 'Такого кода нет. Проверьте буквы и цифры'); ok = false; }
      else { P.fieldError(ref, ''); refOk = true; }
    }
    if (!ok) { (email.getAttribute('aria-invalid') === 'true' ? email : ref).focus(); return; }
    $('[data-email]').textContent = email.value.trim();
    go('code');
    $$('.code-inputs input')[0].focus();
    startResend();
  });

  $('[data-back]').addEventListener('click', function () { clearInterval(timer); go('email'); email.focus(); });

  /* Ввод кода по ячейкам, вставка целиком */
  var cells = $$('.code-inputs input');
  cells.forEach(function (c, i) {
    c.addEventListener('input', function () {
      var v = c.value.replace(/\D/g, '');
      if (v.length > 1) { // вставили весь код
        v.split('').slice(0, 6).forEach(function (ch, k) { if (cells[k]) cells[k].value = ch; });
        cells[Math.min(5, v.length - 1)].focus();
      } else {
        c.value = v;
        if (v && cells[i + 1]) cells[i + 1].focus();
      }
      if (cells.every(function (x) { return x.value; })) steps.code.requestSubmit();
    });
    c.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !c.value && cells[i - 1]) cells[i - 1].focus();
    });
  });

  var tries = 3;
  steps.code.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = cells.map(function (x) { return x.value; }).join('');
    var field = $('#code-field'), err = $('.field__error', field);
    var msg = '';
    if (code.length < 6) msg = 'Введите все 6 цифр из письма';
    else if (C.demo && code !== '123456') { tries--; msg = tries > 0 ? 'Неверный код. ' + P.plural(tries, 'Осталась', 'Осталось', 'Осталось') + ' ' + tries + ' ' + P.plural(tries, 'попытка', 'попытки', 'попыток') : 'Попытки закончились. Запросите новый код'; }
    field.classList.toggle('is-error', !!msg);
    err.textContent = msg;
    err.hidden = !msg;
    if (msg) { cells.forEach(function (x) { x.value = ''; }); cells[0].focus(); return; }
    clearInterval(timer);
    if (refOk) $('[data-done-text]').innerHTML = 'Вы зарегистрировались по приглашению — после первой оплаты начислим 100&nbsp;₽ на баланс.';
    go('done');
  });

  function startResend() {
    var btn = $('[data-resend]'), left = 45;
    clearInterval(timer);
    var tick = function () {
      if (left <= 0) { clearInterval(timer); btn.disabled = false; btn.textContent = 'Отправить снова'; return; }
      btn.disabled = true;
      btn.textContent = 'Отправить снова через 0:' + ('0' + left).slice(-2);
      left--;
    };
    tick();
    timer = setInterval(tick, 1000);
  }
  $('[data-resend]').addEventListener('click', function () { tries = 3; P.toast('Отправили новый код'); startResend(); });

  $$('[data-soon]').forEach(function (b) {
    b.addEventListener('click', function () { P.toast('Вход через ' + b.getAttribute('data-soon') + ' заработает после подключения бэкенда'); });
  });
})();

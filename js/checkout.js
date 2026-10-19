/* Оформление заказа: email, способ оплаты, промокод, количество, согласие с офертой */
(function () {
  'use strict';
  var P = window.PS, CAT = window.CATALOG, C = P.C, $ = P.$, $$ = P.$$, esc = P.esc, money = P.money;
  var root = $('[data-root]');
  var d = CAT.get(P.param('c') || '');
  var plan = d && CAT.findPlan(d, P.param('p') || '', P.param('d'));

  if (!d || !plan) {
    root.innerHTML = '<div class="status"><span class="status__icon status__icon--warn" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 8v5M12 16.5v.5"/><circle cx="12" cy="12" r="9"/></svg></span>' +
      '<h1>Этот пакет закончился</h1><p>Пакет сейчас недоступен или ссылка устарела. Выберите другой — похожие есть на странице страны.</p>' +
      '<div class="status__actions"><a class="btn btn--primary btn--lg" href="' + (d ? P.url.country(d.code) : 'countries.html') + '">Выбрать пакет</a></div></div>';
    return;
  }

  var qty = Math.min(5, Math.max(1, parseInt(P.param('q'), 10) || 1));
  var promo = null; // { code, pct }
  var method = 'sbp', network = 'TRON';
  var pkg = plan.kind === 'fixed' ? plan.gb + ' ГБ' : plan.gb + ' ГБ в день';
  var photo = CAT.photoOf(d);
  var usdt = C.payments && C.payments.usdt;

  root.innerHTML =
    '<ol class="steps-bar" aria-label="Шаги покупки"><li class="is-done"><i>✓</i>Тариф</li><li class="is-now" aria-current="step"><i>2</i>Оплата</li><li><i>3</i>Установка</li></ol>' +
    '<form class="co" novalidate data-form>' +
      '<div class="co__main">' +
        '<h1>Оформление заказа</h1>' +
        '<section class="co-sec">' +
          '<div class="field" id="f-email"><label class="field__label" for="email">Email для QR-кода и квитанции</label>' +
            '<input class="input" id="email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="name@mail.ru" aria-describedby="email-hint email-err">' +
            '<p class="field__error" id="email-err" hidden></p>' +
            '<p class="suggest" data-suggest hidden></p>' +
            '<p class="field__hint" id="email-hint">Регистрация не нужна: на этот адрес придут eSIM и чек, по нему же откроется личный кабинет.</p>' +
            '<p class="info-box" data-has-account hidden>На этот email уже есть кабинет. Заказ появится в нём автоматически. <a class="link" href="login.html">Войти</a>, чтобы оплатить с баланса.</p>' +
          '</div>' +
        '</section>' +
        '<section class="co-sec" aria-labelledby="pay-title"><h2 id="pay-title">Способ оплаты</h2>' +
          '<div class="options" role="radiogroup" aria-labelledby="pay-title" id="f-method">' +
            option('sbp', 'СБП', 'СБП', 'Из приложения любого банка · без комиссии', true) +
            (usdt ? option('usdt', '₮', 'USDT', 'Сети TRON, TON и BEP-20 · покажем адрес и QR', false) : '') +
            '<div class="option is-disabled" aria-disabled="true"><span class="option__icon" aria-hidden="true">💳</span><span class="option__body"><span class="option__title">Банковская карта <span class="badge badge--muted badge--plain">Скоро</span></span><span class="option__sub">Оплата картой пока недоступна</span></span></div>' +
          '</div>' +
          (usdt ? '<div class="subopts" data-networks hidden role="radiogroup" aria-label="Сеть USDT">' + ['TRON', 'TON', 'BEP-20'].map(function (n, i) { return '<button class="chip' + (i ? '' : ' is-active') + '" type="button" role="radio" aria-checked="' + !i + '" data-net="' + n + '">' + n + '</button>'; }).join('') + '</div>' : '') +
          '<p class="field__hint" style="margin-top:12px">Есть деньги на балансе? <a class="link" href="login.html">Войдите</a>, чтобы оплатить с него.</p>' +
        '</section>' +
      '</div>' +

      '<aside class="co__side box" aria-labelledby="order-title">' +
        '<div class="order">' +
          '<h2 id="order-title" style="margin:0">Ваш заказ</h2>' +
          '<div class="order__item"><div class="order__photo"><img src="assets/photos/' + esc(photo) + '" alt="" width="176" height="132"></div>' +
            '<div><span class="order__name">' + P.flag(d, 20) + esc(d.name) + '</span><span class="muted mono small">' + pkg + ' · ' + P.days(plan.days) + ' · ' + esc(d.net) + '</span>' +
            '<a class="link small" href="' + P.url.country(d.code) + '">Изменить пакет</a></div></div>' +
          '<div class="order__qty"><span><b>Количество eSIM</b><br><span class="small muted" data-qty-note></span></span>' +
            '<div class="stepper" role="group" aria-label="Количество"><button type="button" data-q="-1" aria-label="Меньше">−</button><output data-qty></output><button type="button" data-q="1" aria-label="Больше">+</button></div></div>' +
          '<details class="promo" data-promo-box><summary>Есть промокод?</summary>' +
            '<div class="field" id="f-promo"><label class="sr-only" for="promo">Промокод</label><div class="input-row"><input class="input" id="promo" autocomplete="off" placeholder="Промокод" style="text-transform:uppercase"><button class="btn btn--secondary btn--md" type="button" data-promo-apply>Применить</button></div>' +
            '<p class="field__error" hidden></p>' +
            '<p class="field__hint" data-demo>Для демо: TRIP10 — работает, SUMMER25 — истёк</p></div>' +
          '</details>' +
          '<div class="promo-ok" data-promo-ok hidden><span data-promo-label></span><button type="button" data-promo-remove>Убрать</button></div>' +
          '<div class="sum" data-sum></div>' +
          '<label class="check" id="f-agree"><input type="checkbox" id="agree"><span class="check__box" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg></span>' +
            '<span>Принимаю <a href="legal.html?doc=offer" target="_blank">публичную оферту</a> и <a href="legal.html?doc=privacy" target="_blank">политику конфиденциальности</a>, проверил совместимость телефона</span></label>' +
          '<p class="field__error" id="agree-err" hidden>Отметьте согласие, чтобы продолжить</p>' +
          '<div class="err-summary" role="alert" data-errs hidden></div>' +
          '<button class="btn btn--primary btn--lg btn--block" type="submit" data-pay></button>' +
          '<p class="secure">eSIM придёт сразу после оплаты</p>' +
        '</div>' +
      '</aside>' +
    '</form>';

  function option(id, icon, title, sub, checked) {
    return '<label class="option"><input type="radio" name="method" value="' + id + '"' + (checked ? ' checked' : '') + '>' +
      '<span class="option__icon" aria-hidden="true">' + icon + '</span><span class="option__body"><span class="option__title">' + title + '</span><span class="option__sub">' + sub + '</span></span><span class="option__radio" aria-hidden="true"></span></label>';
  }

  /* ---------- Суммы ---------- */
  function totals() {
    var base = plan.price * qty;
    var disc = promo ? Math.round(base * promo.pct / 100) : 0;
    return { base: base, disc: disc, total: base - disc };
  }
  function render() {
    var t = totals();
    $('[data-qty]').textContent = qty;
    $('[data-q="-1"]').disabled = qty <= 1;
    $('[data-q="1"]').disabled = qty >= 5;
    $('[data-qty-note]').textContent = qty > 1 ? 'Каждая eSIM ставится на свой телефон' : 'Для спутников — добавьте ещё';
    $('[data-sum]').innerHTML =
      '<div><span>' + esc(d.name) + ' · ' + pkg + (qty > 1 ? ' × ' + qty : '') + '</span><span>' + money(t.base) + '</span></div>' +
      (t.disc ? '<div style="color:var(--success-600)"><span>Скидка ' + promo.pct + '%</span><span>−' + money(t.disc) + '</span></div>' : '') +
      '<div class="sum__total"><span>К оплате</span><span>' + money(t.total) + '</span></div>';
    var pay = $('[data-pay]');
    if (!pay.classList.contains('is-loading')) pay.innerHTML = 'Оплатить ' + money(t.total) + ' <span aria-hidden="true">→</span>';
  }

  $$('[data-q]').forEach(function (b) { b.addEventListener('click', function () { qty = Math.min(5, Math.max(1, qty + +b.getAttribute('data-q'))); render(); }); });

  /* ---------- Email ---------- */
  var email = $('#email');
  function validateEmail(show) {
    var r = P.checkEmail(email.value);
    if (show) P.fieldError(email, r.error);
    var sug = $('[data-suggest]');
    if (r.suggest) {
      sug.innerHTML = 'Возможно, вы имели в виду <button type="button">' + esc(r.suggest) + '</button>?';
      sug.hidden = false;
      $('button', sug).onclick = function () { email.value = r.suggest; sug.hidden = true; validateEmail(true); };
    } else sug.hidden = true;
    $('[data-has-account]').hidden = !(C.demo && P.norm(email.value) === 'name@mail.ru');
    return !r.error;
  }
  email.addEventListener('blur', function () { if (email.value) validateEmail(true); });
  email.addEventListener('input', function () { if (email.getAttribute('aria-invalid') === 'true') validateEmail(true); });

  /* ---------- Способ оплаты ---------- */
  $$('input[name="method"]').forEach(function (r) {
    r.addEventListener('change', function () {
      method = r.value;
      var nets = $('[data-networks]');
      if (nets) nets.hidden = method !== 'usdt';
    });
  });
  $$('[data-net]').forEach(function (b) {
    b.addEventListener('click', function () {
      network = b.getAttribute('data-net');
      $$('[data-net]').forEach(function (x) { var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-checked', on); });
    });
  });

  /* ---------- Промокод ---------- */
  var promoInput = $('#promo');
  function applyPromo() {
    var v = promoInput.value.trim().toUpperCase();
    if (!v) { P.fieldError(promoInput, 'Введите промокод'); return; }
    if (v === 'TRIP10') {
      promo = { code: v, pct: 10 };
      P.fieldError(promoInput, '');
      $('[data-promo-box]').hidden = true;
      $('[data-promo-ok]').hidden = false;
      $('[data-promo-label]').textContent = 'Промокод ' + v + ' · −10%';
      render();
    } else if (v === 'SUMMER25') {
      P.fieldError(promoInput, 'Срок действия промокода закончился');
    } else {
      P.fieldError(promoInput, 'Такого промокода нет. Проверьте буквы и цифры');
    }
  }
  $('[data-promo-apply]').addEventListener('click', applyPromo);
  promoInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applyPromo(); } });
  $('[data-promo-remove]').addEventListener('click', function () {
    promo = null;
    $('[data-promo-ok]').hidden = true;
    $('[data-promo-box]').hidden = false;
    promoInput.value = '';
    render();
  });

  /* ---------- Отправка ---------- */
  var agree = $('#agree');
  agree.addEventListener('change', function () {
    if (agree.checked) { $('#f-agree').classList.remove('is-error'); $('#agree-err').hidden = true; }
  });

  $('[data-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    var errs = [];
    if (!validateEmail(true)) errs.push(['email', 'укажите email']);
    var agreeOk = agree.checked;
    $('#f-agree').classList.toggle('is-error', !agreeOk);
    $('#agree-err').hidden = agreeOk;
    if (!agreeOk) errs.push(['agree', 'отметьте согласие с офертой']);

    var box = $('[data-errs]');
    if (errs.length > 1) {
      box.innerHTML = 'Проверьте: ' + errs.map(function (x) { return '<a href="#' + x[0] + '">' + x[1] + '</a>'; }).join(', ');
      box.hidden = false;
    } else box.hidden = true;
    if (errs.length) {
      var first = document.getElementById(errs[0][0]);
      first.scrollIntoView({ behavior: P.reduceMotion ? 'auto' : 'smooth', block: 'center' });
      setTimeout(function () { first.focus({ preventScroll: true }); }, 300);
      return;
    }

    var btn = $('[data-pay]');
    btn.classList.add('is-loading');
    btn.textContent = 'Переходим к оплате…';
    var order = 'T-' + String(Math.floor(1000 + Math.random() * 9000));
    // email не кладём в адрес страницы — только в sessionStorage этой вкладки
    try { sessionStorage.setItem('ps-email', email.value.trim()); } catch (err) { /* приватный режим */ }
    var q = new URLSearchParams({ o: order, m: method, c: d.code, p: plan.id, sum: totals().total, q: qty });
    if (plan.kind === 'daily') q.set('d', plan.days);
    if (method === 'usdt') q.set('net', network);
    setTimeout(function () { location.href = 'payment.html?' + q.toString(); }, 700);
  });

  render();
})();

/*
  Оплата и её состояния. В рабочей версии состояние приходит от API
  (вебхук эквайринга + check_transaction), здесь — параметр ?s= и демо-переходы.
*/
(function () {
  'use strict';
  var P = window.PS, CAT = window.CATALOG, C = P.C, $ = P.$, esc = P.esc, money = P.money;
  var root = $('[data-root]');
  var qs = new URLSearchParams(location.search);
  var order = qs.get('o') || 'T-0003';
  var d = CAT.get(qs.get('c') || 'tr') || CAT.get('tr');
  var plan = CAT.findPlan(d, qs.get('p') || 'f5-30', qs.get('d')) || CAT.findPlan(d, 'f5-30');
  var sum = parseInt(qs.get('sum'), 10) || plan.price;
  var method = qs.get('m') === 'usdt' ? 'usdt' : 'sbp';
  var net = qs.get('net') || 'TRON';
  var email = 'вашу почту';
  try { email = sessionStorage.getItem('ps-email') || email; } catch (e) { /* приватный режим */ }

  var RATE = 79; // ₽ за 1 USDT — для вёрстки
  var usdt = (Math.ceil(sum / RATE * 100) / 100 + (parseInt(order.replace(/\D/g, ''), 10) % 97) / 10000).toFixed(4);
  var fmtU = function (v) { return String(v).replace('.', ','); };
  var ADDR = { TRON: 'TQx7mV3pK9nL2wR8sY4fH6jD1cB5aZ9fK2', TON: 'UQB3kd9F2mXa7Lp0Qw8sZr4Vn6Ty1Hc5Je9Gb2Ux4Ia7Ok', 'BEP-20': '0x7f3A92c4E1b05D8a6F3c9B2e7D41aC08f5E9c91e' };

  var back = 'checkout.html?c=' + d.code + '&p=' + plan.id + (plan.kind === 'daily' ? '&d=' + plan.days : '') + (qs.get('q') > 1 ? '&q=' + qs.get('q') : '');
  var orderUrl = 'order.html?o=' + encodeURIComponent(order) + '&c=' + d.code + '&p=' + plan.id + (plan.kind === 'daily' ? '&d=' + plan.days : '') + (qs.get('q') > 1 ? '&q=' + qs.get('q') : '');
  var line = 'Заказ #' + esc(order) + ' · ' + money(sum) + ' · ' + (method === 'usdt' ? 'USDT' : 'СБП');
  var support = P.LINKS.support;

  var I = {
    wait: '<span class="status__icon status__icon--wait" aria-hidden="true"><span class="spinner"></span></span>',
    ok: '<span class="status__icon status__icon--ok" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg></span>',
    bad: '<span class="status__icon status__icon--bad" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></span>',
    warn: '<span class="status__icon status__icon--warn" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>'
  };
  function btn(href, text, kind) { return '<a class="btn btn--' + (kind || 'primary') + ' btn--lg" href="' + href + '">' + text + '</a>'; }
  function supportBtn(text) { return support ? btn(support, text || 'Написать в поддержку', 'secondary') : ''; }
  function copyRow(label, value, shown) {
    return '<div class="copyrow"><span><small>' + label + '</small><b>' + esc(shown || value) + '</b></span><button class="icon-btn" type="button" data-copy="' + esc(value) + '" aria-label="Скопировать: ' + label + '">' + P.ICON.copy + '</button></div>';
  }

  var STATES = {
    sbp: { label: 'СБП: ждём оплату', html: function () {
      return '<div class="status">' + I.wait + '<h1>Оплатите в&nbsp;приложении банка</h1>' +
        '<p>Мы открыли страницу оплаты СБП. На&nbsp;телефоне выберите банк, на&nbsp;компьютере — отсканируйте QR-код камерой телефона.</p>' +
        '<div class="box" style="display:grid;justify-items:center;gap:12px;text-align:center">' + P.fakeQr('sbp' + order, 180) +
        '<p class="mono">' + money(sum) + '</p><p class="small muted">Ссылка действует <b class="timer" data-timer="1800"></b></p></div>' +
        '<div class="status__actions"><a class="btn btn--primary btn--lg" href="#" data-demo-next="checking">Открыть приложение банка</a></div>' +
        '<p class="small muted">' + line + '</p></div>';
    } },
    checking: { label: 'Ждём подтверждения банка', html: function () {
      return '<div class="status">' + I.wait + '<h1>Ждём подтверждения от&nbsp;банка</h1>' +
        '<p>Обычно это несколько секунд. Не&nbsp;закрывайте страницу и&nbsp;не&nbsp;платите повторно.</p><p class="small muted">' + line + '</p></div>';
    }, next: 'preparing', delay: 3000 },
    preparing: { label: 'Готовим eSIM', html: function () {
      return '<div class="status">' + I.ok + '<h1>Оплата прошла. Готовим eSIM…</h1>' +
        '<p>Обычно до&nbsp;30 секунд. Можно закрыть страницу: QR-код придёт на&nbsp;' + esc(email) + '.</p><span class="spinner" aria-hidden="true"></span></div>';
    }, next: 'order', delay: 2500 },
    failed: { label: 'Банк отклонил', html: function () {
      return '<div class="status">' + I.bad + '<h1>Банк не&nbsp;подтвердил платёж</h1>' +
        '<p>Деньги не&nbsp;списаны. Заказ сохранён — можно попробовать ещё раз или выбрать другой способ.</p>' +
        '<div class="box"><b>Частые причины</b><ul class="reasons" style="margin-top:8px"><li>не подтвердили перевод в приложении банка</li><li>ссылка на оплату истекла: она действует 30 минут</li><li>банк отклонил перевод или превышен лимит — позвоните в банк</li></ul></div>' +
        '<div class="status__actions">' + btn('payment.html?' + withState('sbp'), 'Попробовать снова') + btn(back, 'Другой способ оплаты', 'secondary') + '</div></div>';
    } },
    expired: { label: 'Время вышло', html: function () {
      return '<div class="status">' + I.warn + '<h1>Время на&nbsp;оплату вышло</h1>' +
        '<p>Ссылка действует 30 минут. Оформите заказ заново: цена могла немного измениться. Если вы уже отправили деньги — напишите в&nbsp;поддержку с&nbsp;номером заказа #' + esc(order) + ', разберёмся.</p>' +
        '<div class="status__actions">' + btn(back, 'Оформить заново') + supportBtn('Я уже оплатил') + '</div></div>';
    } },
    notissued: { label: 'eSIM не выдана', html: function () {
      return '<div class="status">' + I.warn + '<h1>Оплата прошла, но&nbsp;eSIM пока не&nbsp;готова</h1>' +
        '<p>Деньги получены. Мы уже занимаемся заказом #' + esc(order) + ' и&nbsp;пришлём eSIM на&nbsp;' + esc(email) + ' в&nbsp;течение часа. Если не&nbsp;получится — вернём деньги полностью.</p>' +
        '<div class="status__actions">' + supportBtn() + btn('index.html', 'На главную', 'ghost') + '</div></div>';
    } },
    usdt: { label: 'USDT: счёт', html: function () {
      return '<div class="invoice"><div class="row" style="justify-content:space-between"><span class="badge badge--info">Ждём перевод</span><span class="small muted">Осталось <b class="timer" data-timer="1800"></b></span></div>' +
        '<h1 style="font-size:32px;line-height:38px">Переведите ' + fmtU(usdt) + ' USDT</h1>' +
        '<div class="chips chips--sm" role="tablist" aria-label="Сеть">' + ['TRON', 'TON', 'BEP-20'].map(function (n) {
          return '<a class="chip' + (n === net ? ' is-active' : '') + '" role="tab" aria-selected="' + (n === net) + '" href="payment.html?' + withState('usdt', { net: n }) + '">USDT · ' + n + '</a>';
        }).join('') + '</div>' +
        '<div class="box invoice__grid">' + P.fakeQr(net + order, 200) + '<div class="stack">' +
          copyRow('Адрес · сеть ' + net, ADDR[net]) + copyRow('Сумма точно', fmtU(usdt), fmtU(usdt) + ' USDT') +
          (net === 'TON' ? copyRow('Комментарий к переводу', order) : '') + '</div></div>' +
        '<p class="warn-box">Отправляйте только в&nbsp;сети ' + net + '. Перевод в&nbsp;другой сети не&nbsp;дойдёт. ' +
          (net === 'TON' ? 'Обязательно укажите комментарий — по нему мы узнаём платёж.' : 'Отправьте ровно эту сумму, до последней цифры: по ней мы узнаём ваш платёж. С биржи — выберите «получатель получит ровно».') + '</p>' +
        '<p class="secure"><span class="spinner" style="width:16px;height:16px;border-width:2px" aria-hidden="true"></span>Страница обновится сама, как только сеть подтвердит перевод</p></div>';
    } },
    partial: { label: 'USDT: нужна доплата', html: function () {
      var got = (usdt - 1).toFixed(4), need = '1.0427';
      return '<div class="invoice"><div class="row" style="justify-content:space-between"><span class="badge badge--warn">Нужна доплата</span><span class="small muted">Осталось <b class="timer" data-timer="1781"></b></span></div>' +
        '<h1 style="font-size:32px;line-height:38px">Доплатите ' + fmtU(need) + ' USDT</h1>' +
        '<p class="muted">Похоже, биржа вычла свою комиссию. Мы засчитали поступившее в&nbsp;заказ.</p>' +
        '<div class="box stack"><div class="row" style="justify-content:space-between"><span>Уже получили ' + fmtU(got) + ' из ' + fmtU(usdt) + ' USDT</span><b class="mono">86%</b></div><div class="progress"><i style="width:86%"></i></div></div>' +
        '<div class="box invoice__grid">' + P.fakeQr('part' + order, 200) + '<div class="stack">' + copyRow('Адрес · сеть ' + net + ' (та же, что и первый перевод)', ADDR[net]) + copyRow('Сумма точно', fmtU(need), fmtU(need) + ' USDT') + '</div></div>' +
        '<p class="warn-box">Если за&nbsp;30 минут доплата не&nbsp;придёт, заказ отменим, а&nbsp;полученные ' + fmtU(got) + ' USDT вернём.</p></div>';
    } },
    notfound: { label: 'USDT: перевод не найден', html: function () {
      return '<div class="status">' + I.warn + '<h1>Не видим ваш перевод</h1>' +
        '<p>Если вы уже отправили USDT, пришлите хэш транзакции. Найдём перевод и&nbsp;зачислим его. Перевод в&nbsp;другой сети или другой монете вернуть можем не&nbsp;всегда.</p>' +
        '<form class="box stack" data-hash novalidate><div class="field"><label class="field__label" for="hash">Хэш транзакции</label><input class="input mono" id="hash" autocomplete="off" placeholder="7f3a…c91e"><p class="field__error" hidden></p></div>' +
        '<button class="btn btn--primary btn--lg btn--block" type="submit">Отправить в поддержку</button></form></div>';
    } },
    review: { label: 'USDT: хэш на проверке', html: function () {
      return '<div class="status">' + I.wait + '<h1>Проверяем перевод</h1>' +
        '<p>Мы получили хэш и&nbsp;сверяем перевод в&nbsp;блокчейне. Оператор работает с&nbsp;9:00 до&nbsp;21:00 по&nbsp;Москве, результат придёт на&nbsp;' + esc(email) + '.</p>' +
        '<div class="status__actions">' + btn('index.html', 'На главную', 'secondary') + '</div></div>';
    } }
  };

  function withState(s, extra) {
    var q = new URLSearchParams(location.search);
    q.set('s', s);
    if (extra) Object.keys(extra).forEach(function (k) { q.set(k, extra[k]); });
    return q.toString();
  }

  var timers = [], autoTimer;
  function show(s) {
    var st = STATES[s] || STATES[method === 'usdt' ? 'usdt' : 'sbp'];
    s = STATES[s] ? s : (method === 'usdt' ? 'usdt' : 'sbp');
    timers.forEach(clearInterval);
    clearTimeout(autoTimer);
    root.innerHTML = st.html();
    document.title = (st.label || 'Оплата') + ' — Привет SIM';

    P.$$('[data-timer]', root).forEach(function (el) {
      var left = +el.getAttribute('data-timer');
      var tick = function () {
        el.textContent = Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2);
        if (left-- <= 0) show('expired');
      };
      tick();
      timers.push(setInterval(tick, 1000));
    });
    var next = $('[data-demo-next]', root);
    if (next) next.addEventListener('click', function (e) { e.preventDefault(); go(next.getAttribute('data-demo-next')); });
    if (st.next) autoTimer = setTimeout(function () { go(st.next); }, st.delay);

    var hash = $('[data-hash]', root);
    if (hash) hash.addEventListener('submit', function (e) {
      e.preventDefault();
      var h = $('#hash');
      var v = h.value.trim();
      P.fieldError(h, !v ? 'Вставьте хэш транзакции' : v.length < 20 ? 'Похоже, хэш неполный — скопируйте его целиком из кошелька' : '');
      if (v.length >= 20) go('review');
    });

    P.$$('[data-states] .chip').forEach(function (c) { c.classList.toggle('is-active', c.getAttribute('data-s') === s); });
    var h1 = $('h1', root);
    if (h1) { h1.tabIndex = -1; }
  }
  function go(s) {
    if (s === 'order') { location.href = orderUrl; return; }
    history.replaceState(null, '', '?' + withState(s));
    show(s);
    var h1 = $('h1', root);
    if (h1) h1.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  var bar = $('[data-states]');
  if (bar) {
    bar.innerHTML = Object.keys(STATES).map(function (k) { return '<button class="chip" type="button" data-s="' + k + '">' + STATES[k].label + '</button>'; }).join('') +
      '<a class="chip" href="' + orderUrl + '">→ eSIM готова</a>';
    bar.addEventListener('click', function (e) { var b = e.target.closest('[data-s]'); if (b) go(b.getAttribute('data-s')); });
  }

  show(qs.get('s') || method);
  if (!qs.get('s') && method === 'sbp' && C.demo) autoTimer = setTimeout(function () { go('checking'); }, 6000);
})();

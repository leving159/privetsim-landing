/*
  Заказ оплачен: QR-код, ручная установка, инструкции.
  Страница открывается по ссылке из письма без входа (в рабочей версии — по секретному токену заказа).
*/
(function () {
  'use strict';
  var P = window.PS, CAT = window.CATALOG, $ = P.$, $$ = P.$$, esc = P.esc;
  var root = $('[data-root]');
  var qs = new URLSearchParams(location.search);
  var order = qs.get('o') || 'T-0003';
  var d = CAT.get(qs.get('c') || 'tr') || CAT.get('tr');
  var plan = CAT.findPlan(d, qs.get('p') || 'f5-30', qs.get('d')) || CAT.findPlan(d, 'f5-30');
  var qty = Math.min(5, Math.max(1, parseInt(qs.get('q'), 10) || 1));
  var email = 'вашу почту';
  try { email = sessionStorage.getItem('ps-email') || email; } catch (e) { /* приватный режим */ }

  var pkg = plan.kind === 'fixed' ? plan.gb + ' ГБ' : plan.gb + ' ГБ в день';
  var SMDP = 'smdp.privetsim.app';
  function code(i) {
    var s = (order + i).split('').reduce(function (h, c) { return (h * 33 + c.charCodeAt(0)) >>> 0; }, 5381).toString(36).toUpperCase();
    return ('K2' + s + 'QF491XM2LDA8C3P').replace(/(.{4})/g, '$1-').slice(0, 24);
  }
  var isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
  document.title = 'eSIM «' + d.name + '» готова к установке — Привет SIM';

  function copyRow(label, value) {
    return '<div class="copyrow"><span><small>' + label + '</small><b>' + esc(value) + '</b></span><button class="icon-btn" type="button" data-copy="' + esc(value) + '" aria-label="Скопировать: ' + label + '">' + P.ICON.copy + '</button></div>';
  }

  function qrBlock(i) {
    return '<div class="box ready__qr" data-esim="' + i + '"' + (i ? ' hidden' : '') + '>' +
      '<div class="row" style="justify-content:space-between;width:100%"><b>' + P.flag(d, 20) + ' ' + esc(d.name) + ' · ' + pkg + '</b><span class="badge badge--info">Ждёт установки</span></div>' +
      P.fakeQr(code(i), 220) +
      '<a class="btn btn--primary btn--lg" href="#" data-onetap>Установить в один тап</a>' +
      '<p class="small muted">Работает, если вы открыли эту страницу на&nbsp;телефоне, куда ставите eSIM. ' + (isIos ? '' : 'На компьютере — наведите камеру телефона на&nbsp;QR-код.') + '</p>' +
      '<details style="width:100%;text-align:left"><summary class="link" style="cursor:pointer">Ручная установка</summary><div class="stack" style="margin-top:10px">' +
        copyRow('Адрес SM-DP+', SMDP) + copyRow('Код активации', code(i)) + '</div></details>' +
    '</div>';
  }

  var tabsEsim = qty > 1 ? '<div class="chips chips--sm" role="tablist" aria-label="eSIM в заказе" style="justify-content:center">' +
    Array.apply(null, Array(qty)).map(function (_, i) { return '<button class="chip' + (i ? '' : ' is-active') + '" type="button" role="tab" aria-selected="' + !i + '" data-pick="' + i + '">eSIM ' + (i + 1) + '</button>'; }).join('') + '</div>' : '';

  var IOS = [
    ['Откройте Настройки → Сотовая связь', 'Нажмите «Добавить eSIM» и выберите «Использовать QR-код».', 'НАСТРОЙКИ › СОТОВАЯ СВЯЗЬ'],
    ['Наведите камеру на QR-код', 'Или нажмите «Установить в один тап», если страница открыта на этом iPhone.'],
    ['Назовите линию «Привет SIM»', 'Выберите её только для сотовых данных, основной номер оставьте для звонков и SMS.'],
    ['После посадки включите роуминг', 'Для линии Привет SIM включите «Роуминг данных».', 'СОТОВАЯ СВЯЗЬ › ПРИВЕТ SIM › РОУМИНГ ДАННЫХ']
  ];
  var ANDROID = [
    ['Откройте Настройки → Подключения', 'Диспетчер SIM-карт → «Добавить eSIM» (на Pixel: Сеть и интернет → SIM-карты).', 'НАСТРОЙКИ › ПОДКЛЮЧЕНИЯ › ДИСПЕТЧЕР SIM'],
    ['Выберите «Сканировать QR-код»', 'Наведите камеру на код. Нет камеры под рукой — введите адрес SM-DP+ и код активации вручную.'],
    ['Выберите линию для мобильных данных', 'Основной номер оставьте для звонков и SMS.'],
    ['После посадки включите роуминг', 'Для eSIM Привет SIM включите «Роуминг данных».']
  ];
  function steps(list) {
    return '<ol class="isteps">' + list.map(function (s) { return '<li><b>' + s[0] + '</b><p>' + s[1] + '</p>' + (s[2] ? '<span class="path">' + s[2] + '</span>' : '') + '</li>'; }).join('') + '</ol>';
  }

  root.innerHTML =
    '<div class="ready">' +
        '<header class="ready__head"><span class="badge badge--ok">Оплачено · заказ #' + esc(order) + '</span>' +
          '<h1>Оплата прошла. Осталось установить eSIM' + (qty > 1 ? ' — ' + qty + ' шт.' : '') + '</h1>' +
          '<p>Сделайте это за&nbsp;день до&nbsp;вылета, пока есть Wi-Fi. Копию QR-кода и&nbsp;инструкцию мы отправили на&nbsp;<b>' + esc(email) + '</b>.</p>' +
          (qty > 1 ? '<p class="info-box" style="margin-top:12px">Каждую eSIM ставьте на&nbsp;свой телефон. Отправить eSIM спутнику можно из&nbsp;кабинета, пока её не&nbsp;установили.</p>' : '') +
        '</header>' +
      '<div class="ready__qr-wrap stack">' + tabsEsim + Array.apply(null, Array(qty)).map(function (_, i) { return qrBlock(i); }).join('') + '</div>' +
      '<div class="ready__info stack" style="gap:32px">' +
        '<section><h2 class="h3" style="margin-bottom:14px">Как установить</h2>' +
          '<div class="segment" role="tablist" data-tabs="os" style="margin-bottom:18px">' +
            '<button class="segment__btn' + (isIos || !/Android/.test(navigator.userAgent) ? ' is-active' : '') + '" type="button" role="tab" aria-controls="os-ios" aria-selected="true">iPhone</button>' +
            '<button class="segment__btn" type="button" role="tab" aria-controls="os-android" aria-selected="false">Android</button>' +
          '</div>' +
          '<div id="os-ios" role="tabpanel">' + steps(IOS) + '</div><div id="os-android" role="tabpanel" hidden>' + steps(ANDROID) + '</div>' +
        '</section>' +
        '<p class="warn-box">QR-код одноразовый. Не&nbsp;удаляйте eSIM из&nbsp;настроек — восстановить её будет нельзя.</p>' +
        '<div class="box box--tint"><b>Личный кабинет создан на&nbsp;' + esc(email) + '</b><p class="muted" style="margin-top:6px">Там QR-код, остаток гигабайтов, пополнение и&nbsp;квитанции. Пароль не&nbsp;нужен — вход по&nbsp;коду из&nbsp;письма.</p>' +
          '<div class="row" style="margin-top:14px"><a class="btn btn--primary btn--md" href="login.html">Открыть личный кабинет</a><a class="btn btn--secondary btn--md" data-link="support" href="#">Помощь в Telegram</a></div></div>' +
      '</div>' +
    '</div>';

  // Повторно применяем общие обработчики к динамической разметке
  P.$$('[data-link]', root).forEach(function (a) { var u = P.LINKS[a.getAttribute('data-link')]; if (!u) a.hidden = true; else { a.href = u; a.target = '_blank'; a.rel = 'noopener'; } });
  var tabs = $('[data-tabs="os"]');
  if (tabs) {
    var btns = $$('[role="tab"]', tabs);
    if (/Android/.test(navigator.userAgent)) select(btns[1]);
    btns.forEach(function (b) { b.addEventListener('click', function () { select(b); }); });
  }
  function select(b) {
    btns.forEach(function (x) {
      var on = x === b;
      x.classList.toggle('is-active', on);
      x.setAttribute('aria-selected', on);
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
  }
  $$('[data-pick]').forEach(function (b) {
    b.addEventListener('click', function () {
      var i = b.getAttribute('data-pick');
      $$('[data-pick]').forEach(function (x) { var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on); });
      $$('[data-esim]').forEach(function (x) { x.hidden = x.getAttribute('data-esim') !== i; });
    });
  });
  $$('[data-onetap]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      P.toast(isIos ? 'Вёрстка: здесь откроется установка eSIM в iOS' : 'Откройте страницу на телефоне, куда ставите eSIM');
    });
  });
})();

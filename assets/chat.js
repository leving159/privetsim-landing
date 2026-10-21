/*
  Чат поддержки (макет site-23): кнопка в углу каждой страницы.
  Гость оставляет email и тему, вошедший сразу пишет. Первым отвечает помощник
  (ответы по ключевым словам), сложные вопросы уходят оператору: днём он «подключается»,
  ночью вопрос встаёт в очередь. В рабочей версии сообщения пойдут на сервер (apps/api).
  Ссылки href="#chat" на любой странице открывают чат.
*/
(function () {
  'use strict';
  var KEY = 'ps.chat.v2';
  var PSA = window.PSA || {};
  var doc = document;
  var NB = ' ';
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || {}; } catch (e) { return {}; } }
  function store(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function hm(ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  // Оператор работает с 9:00 до 21:00 по Москве
  function dayMsk() { var h = (new Date().getUTCHours() + 3) % 24; return h >= 9 && h < 21; }
  var OK = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var MAIL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A6175" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>';
  var TOPICS = ['Не' + NB + 'работает интернет', 'Как' + NB + 'установить', 'Возврат', 'Оплата'];

  var c = load(), root = null, typing = false;
  function me() { return PSA.user ? PSA.user() : null; }
  function email() { var u = me(); return u ? u.email : c.email || ''; }

  // Вошли под другим email — начинаем новый диалог
  (function () { var u = me(); if ((c.uid && (!u || u.id !== c.uid)) || (u && c.email && c.email !== u.email)) { c = {}; store(c); } if (u && !c.started) { c.email = u.email; } })();

  function push(m) { m.ts = m.ts || Date.now(); c.msgs = c.msgs || []; c.msgs.push(m); store(c); }
  function greet() {
    var u = me(), list = PSA.esims ? PSA.esims() : [], live = list.filter(function (e) { return e.live; })[0], wait = list.filter(function (e) { return e.waiting; })[0];
    var see = live ? 'Вижу вашу eSIM «' + live.short + '» — ' + live.stText.toLowerCase() + '. ' : (wait ? 'Вижу вашу eSIM «' + wait.short + '» — она ждёт установки. ' : '');
    var n = PSA.ordersByEmail ? PSA.ordersByEmail(email()) : 0;
    push({ who: 'sys', text: u ? 'Вы' + NB + 'вошли как' + NB + u.email : (n ? 'Нашли ' + n + ' ' + PSA.plural(n, 'заказ', 'заказа', 'заказов') + ' на' + NB + email() : 'Ответы продублируем на' + NB + email()) });
    push({ who: 'op', text: 'Здравствуйте! Я ИИ-помощник Привет SIM. ' + see + 'Чем помочь? Если понадобится, позову оператора.', meta: 'ИИ-помощник' });
  }
  function start(topic) {
    c.started = true; c.email = email(); c.uid = me() ? me().id : ''; c.ended = false; c.msgs = []; greet();
    if (topic) send(topic.replace(/ /g, ' '));
  }

  // Ответы помощника по ключевым словам (в рабочей версии — ИИ с доступом к заказам)
  var RULES = [
    [/спасиб|благодар|помогл|всё понятно|разобрал/i, 'end'],
    [/оператор|человек|живой|специалист/i, 'op'],
    [/не (ловит|работает|подключ)|нет сети|интернет|роуминг|сеть|скорост/i, 'Проверьте, пожалуйста: Настройки → Сотовая связь → Привет SIM → «Роуминг данных» должен быть включён, а для сотовых данных выбрана линия Привет SIM. Если не поможет — напишите, позову оператора.'],
    [/установ|qr|куар|скан|актив/i, 'Откройте «Мои eSIM» → нужная eSIM → «QR и установка». На iPhone с iOS 17.4+ есть установка в один тап. Ставьте eSIM за день до вылета, пока есть Wi‑Fi: QR-код одноразовый.'],
    [/возврат|вернуть|верните|деньги назад/i, 'Оформите возврат на странице eSIM → «Покупка и пополнения» → «Вернуть». Если eSIM не устанавливалась — вернём полностью на баланс, сразу. После установки — по заявке, ответим в течение 24 часов.'],
    [/оплат|сбп|usdt|крипт|карт|банк|списал/i, 'Оплатить можно по СБП (без комиссии), в USDT (TRON, TON, BEP-20) или с баланса. Ссылка на оплату действует 30 минут. Если деньги списались, а eSIM не пришла — напишите номер заказа, проверим.'],
    [/баланс|пополн/i, 'Баланс пополняется в кабинете → «Баланс» по СБП или в USDT и тратится на любые eSIM и гигабайты. Пополнить саму eSIM можно на её странице кнопкой «Пополнить».'],
    [/друг|реферал|приглас|25/i, 'В разделе «Позвать друзей» есть ваша ссылка и код. Вам — 25% с каждой оплаты друга, другу — 100 ₽ на баланс после первой eSIM.'],
    [/телефон|поддерж|совмест|iphone|android|samsung/i, 'Проверить телефон можно на странице «Совместимость»: там список моделей. Важно, чтобы телефон был без привязки к оператору.']
  ];
  function reply(text) {
    var r = null;
    for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(text)) { r = RULES[i][1]; break; }
    if (!r) { c.miss = (c.miss || 0) + 1; r = c.miss >= 2 ? 'op' : 'Уточните, пожалуйста: вопрос про установку, интернет в поездке, оплату или возврат? Если удобнее — позову оператора.'; }
    if (r === 'end') {
      push({ who: 'op', text: 'Рад, что помог! Хорошей поездки.', meta: 'ИИ-помощник' });
      push({ who: 'sysb', text: 'Диалог завершён · копия отправлена на' + NB + email() });
      c.ended = true; c.rating = 0; store(c); return;
    }
    if (r === 'op') {
      c.miss = 0;
      if (dayMsk()) {
        push({ who: 'op', text: 'Похоже, нужна помощь специалиста. Подключаю оператора, он уже видит нашу переписку.', meta: 'ИИ-помощник' });
        later(2600, function () { push({ who: 'sys', text: 'Подключился оператор Анна' }); push({ who: 'op', text: 'Здравствуйте, это Анна. Уже смотрю ваш вопрос — ответ напишу здесь и продублирую на ' + email() + '.', meta: 'Анна · оператор' }); });
      } else {
        push({ who: 'op', text: 'Этот вопрос решит оператор. Он работает с 9:00 до 21:00 по Москве. Я передал ваш вопрос: оператор ответит утром, ответ придёт сюда и на ' + email() + '.', meta: 'ИИ-помощник' });
        push({ who: 'sys', text: 'Вопрос в очереди к оператору · ответим после 9:00 МСК' });
      }
      return;
    }
    push({ who: 'op', text: r, meta: 'ИИ-помощник' });
  }
  function later(ms, fn) { typing = true; render(); setTimeout(function () { typing = false; fn(); if (!isOpen()) { c.unread = true; store(c); } render(); }, ms); }
  function send(text) {
    text = String(text || '').trim(); if (!text) return;
    if (c.ended) { c.ended = false; c.rating = 0; }
    push({ who: 'me', text: text });
    later(1100, function () { reply(text); });
  }

  /* ---------- Отрисовка ---------- */
  function bubbles() {
    var h = '';
    (c.msgs || []).forEach(function (m) {
      if (m.who === 'me') h += '<div class="cw-m cw-me">' + esc(m.text) + '</div>';
      else if (m.who === 'op') h += '<div class="cw-m cw-op">' + esc(m.text) + '</div>' + (m.meta ? '<span class="cw-meta">' + esc(m.meta) + ' · ' + hm(m.ts) + '</span>' : '');
      else if (m.who === 'sysb') h += '<span class="cw-sys" style="background: #F2F5FF; color: #1F45D6">' + esc(m.text) + '</span>';
      else h += '<span class="cw-sys">' + OK + esc(m.text) + '</span>';
    });
    if (typing) h += '<span class="cw-m cw-op cw-typ" aria-label="Помощник печатает"><i></i><i></i><i></i></span>';
    if (c.ended) {
      h += '<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px; border-radius: 20px; background: #FFFFFF; margin-top: auto"><b style="font-size: 15px">' + (c.rating ? 'Спасибо за оценку!' : 'Насколько помог ответ?') + '</b><span style="display: flex; gap: 6px">';
      for (var i = 1; i <= 5; i++) { var on = i <= (c.rating || 0); h += '<button type="button" data-rate="' + i + '" aria-label="Оценка ' + i + '" style="width: 36px; height: 36px; border: 0; border-radius: 12px; cursor: pointer; font: 600 14px/1 \'Onest\', system-ui, sans-serif; background: ' + (on ? '#FF7A45' : '#F5F6F9') + '; color: ' + (on ? '#FFFFFF' : '#8C92A3') + '">' + i + '</button>'; }
      h += '</span><span style="font-size: 12px; color: #8C92A3">Напишите снова' + NB + '— продолжим в' + NB + 'этом же' + NB + 'диалоге</span></div>';
    }
    return h;
  }
  function intro() {
    return '<div class="cw-m cw-op">Здравствуйте! Оставьте email' + NB + '— по' + NB + 'нему мы' + NB + 'найдём ваши заказы и' + NB + 'eSIM и' + NB + 'ответим на' + NB + 'почту, даже если вы' + NB + 'закроете сайт.</div><span class="cw-meta">Привет SIM · сейчас</span>' +
      '<div style="display: flex; flex-direction: column; gap: 10px; margin-top: auto; padding: 14px; border-radius: 20px; background: #FFFFFF">' +
      '<label class="cw-in" data-mail style="box-shadow: inset 0 0 0 1.5px #2F5BFF">' + MAIL + '<input type="email" placeholder="name@mail.ru" aria-label="Ваш email" value="' + esc(c.draftEmail || '') + '"></label>' +
      '<span data-err role="alert" style="display: none; font-size: 12px; color: #C62F35">Проверьте email' + NB + '— на' + NB + 'него придут ответы</span>' +
      '<span style="font-size: 12px; color: #5A6175">О' + NB + 'чём хотите спросить?</span><span class="cw-q">' +
      TOPICS.map(function (t, i) { var on = c.topic === i; return '<span role="button" tabindex="0" data-topic="' + i + '" aria-pressed="' + on + '" style="' + (on ? 'background: #2F5BFF; color: #FFFFFF; box-shadow: none' : '') + '">' + t + '</span>'; }).join('') + '</span>' +
      '<button type="button" class="cw-btn" data-start style="border: 0; width: 100%">Начать чат</button>' +
      '<span style="font-size: 11px; line-height: 15px; color: #8C92A3">Нажимая «Начать чат», вы' + NB + 'соглашаетесь с <a href="legal.html?doc=consent">обработкой персональных данных</a></span></div>';
  }
  function isOpen() { return !!(root && root.open); }
  function render() {
    if (!root) return;
    var bd = root.querySelector('.cw-bd'), ft = root.querySelector('.cw-ft');
    var guest = !me() && !c.started;
    bd.innerHTML = guest ? intro() : bubbles();
    ft.style.display = guest ? 'none' : '';
    bd.scrollTop = bd.scrollHeight;
    var dot = root.querySelector('.cw-dot'); if (dot) dot.style.display = c.unread ? '' : 'none';
  }

  function mount() {
    var orig = doc.querySelector('#dc-root details.cw');
    if (!orig || root) return !!root;
    root = orig.cloneNode(true);
    root.removeAttribute('open');
    var st = doc.createElement('style'); st.textContent = '#dc-root details.cw{display:none !important}'; doc.head.appendChild(st);
    doc.body.appendChild(root);
    // Поле ввода и кнопки
    var input = root.querySelector('.cw-ft input'), sendBtn = root.querySelector('.cw-ft .cw-send'), clip = root.querySelector('.cw-ft .cw-ic');
    var file = doc.createElement('input'); file.type = 'file'; file.accept = 'image/*'; file.hidden = true; root.appendChild(file);
    var go = function () { if (!c.started) start(); send(input.value); input.value = ''; };
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    sendBtn.setAttribute('role', 'button'); sendBtn.tabIndex = 0; sendBtn.style.cursor = 'pointer';
    sendBtn.addEventListener('click', function (e) { e.preventDefault(); go(); });
    clip.setAttribute('role', 'button'); clip.tabIndex = 0; clip.style.cursor = 'pointer';
    clip.addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () { if (file.files[0]) { if (!c.started) start(); push({ who: 'me', text: 'Скриншот: ' + file.files[0].name }); later(1000, function () { push({ who: 'op', text: 'Спасибо, скриншот получили. Посмотрим и ответим здесь.', meta: 'ИИ-помощник' }); }); file.value = ''; } });
    // Гостевая форма
    root.querySelector('.cw-bd').addEventListener('click', function (e) {
      var t = e.target.closest('[data-topic]'), s = e.target.closest('[data-start]'), r = e.target.closest('[data-rate]');
      if (t) { c.topic = c.topic === +t.dataset.topic ? null : +t.dataset.topic; c.draftEmail = (root.querySelector('[data-mail] input') || {}).value || ''; store(c); render(); }
      if (s) {
        var v = (root.querySelector('[data-mail] input').value || '').trim();
        if (!PSA.validEmail || !PSA.validEmail(v)) { root.querySelector('[data-err]').style.display = ''; return; }
        c.email = v; var tp = c.topic != null ? TOPICS[c.topic] : ''; c.topic = null; start(tp); render();
      }
      if (r) { c.rating = +r.dataset.rate; store(c); render(); }
    });
    root.addEventListener('toggle', function () { if (root.open) { c.unread = false; store(c); if (me() && !c.started) start(); render(); setTimeout(function () { var i = root.querySelector('.cw-ft input'); if (i && root.querySelector('.cw-ft').style.display !== 'none') i.focus(); }, 60); } else render(); });
    render();
    return true;
  }
  // Ссылки «Поддержка», «Написать в поддержку» → открыть чат
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#chat"]');
    if (!a) return;
    e.preventDefault();
    if (mount() || root) { root.open = true; }
  });
  // Ждём, пока runtime макета отрисует страницу
  function wait() { if (mount()) return; var ob = new MutationObserver(function () { if (mount()) ob.disconnect(); }); ob.observe(doc.body, { childList: true, subtree: true }); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', wait); else wait();
  window.PSChat = { open: function () { if (root) root.open = true; } };
})();

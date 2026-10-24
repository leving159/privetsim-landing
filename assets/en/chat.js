/*
  Чат поддержки (макет site-23): кнопка в углу каждой страницы.
  Гость оставляет email и тему, вошедший сразу пишет. Первым отвечает ИИ-помощник,
  сложные вопросы уходят оператору (админка → «Диалоги»).
  • рабочий режим (SITE_CONFIG.demo: false): сообщения идут в apps/api — /api/chat/start, send, poll (long-poll), rate, upload;
  • демо (demo: true): ответы по ключевым словам прямо в браузере, оператор «подключается» понарошку.
  Ссылки href="#chat" на любой странице открывают чат.
*/
(function () {
  'use strict';
  var KEY = 'ps.chat.v3';
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
  var TOPICS = ['Internet isn\'t working', 'How to install', 'Refund', 'Payment'];

  var CFG = window.SITE_CONFIG || {};
  var API = PSA.DEMO ? '' : String(CFG.apiUrl || '').replace(/\/$/, '');
  var LIVE = !!API;
  var c = load(), root = null, typing = false, polling = false, typingTimer = 0;
  function me() { return PSA.user ? PSA.user() : null; }
  function email() { var u = me(); return u ? u.email : c.email || ''; }

  // Вошли под другим email — начинаем новый диалог
  (function () { var u = me(); if ((c.uid && (!u || u.id !== c.uid)) || (u && c.email && c.email !== u.email)) { c = {}; store(c); } if (u && !c.started) { c.email = u.email; } })();

  function push(m) { m.ts = m.ts || Date.now(); c.msgs = c.msgs || []; c.msgs.push(m); store(c); }
  function greet() {
    var u = me(), list = PSA.esims ? PSA.esims() : [], live = list.filter(function (e) { return e.live; })[0], wait = list.filter(function (e) { return e.waiting; })[0];
    var see = live ? 'I can see your eSIM “' + live.short + '» — ' + live.stText.toLowerCase() + '. ' : (wait ? 'I can see your eSIM “' + wait.short + '” — it\'s waiting to be installed. ' : '');
    var n = PSA.ordersByEmail ? PSA.ordersByEmail(email()) : 0;
    push({ who: 'sys', text: u ? 'You\'re logged in as' + NB + u.email : (n ? 'Found ' + n + ' ' + PSA.plural(n, 'order', 'orders', 'orders') + ' for' + NB + email() : 'We\'ll also send replies to' + NB + email()) });
    push({ who: 'op', text: 'Hello! I\'m the Privet SIM AI assistant. ' + see + 'How can I help? I\'ll bring in a human agent if needed.', meta: 'AI assistant' });
  }
  function start(topic) {
    if (LIVE) return liveStart(topic);
    c.started = true; c.email = email(); c.uid = me() ? me().id : ''; c.ended = false; c.msgs = []; greet();
    if (topic) send(topic.replace(/ /g, ' '));
  }
  /* ---------- Рабочий режим: сервер поддержки ---------- */
  function call(method, path, body, type) {
    var opt = { method: method, credentials: 'include', headers: {} };
    if (window.PS && PS.lang === 'en') opt.headers['x-lang'] = 'en';
    if (body !== undefined) { opt.headers['Content-Type'] = type || 'application/json'; opt.body = type ? body : JSON.stringify(body); }
    return fetch(API + '/api' + path, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'error'); e.status = r.status; throw e; } return j; });
    });
  }
  function fromServer(m) {
    var att = (m.attachments || []).map(function (a) { return a.kind === 'image' && a.url ? (/^https?:/.test(a.url) ? a.url : API + a.url) : null; }).filter(Boolean);
    return { id: m.id, who: m.who === 'me' ? 'me' : m.who === 'sys' ? 'sys' : 'op', text: m.text, meta: m.meta, img: att[0] || null, ts: Date.parse(m.at) };
  }
  // Новые сообщения с сервера: свои «отправляется…» заменяем подтверждёнными, дубли отбрасываем
  function merge(list) {
    c.msgs = c.msgs || [];
    var seen = {}; c.msgs.forEach(function (m) { if (m.id) seen[m.id] = 1; });
    list.forEach(function (raw) {
      var m = fromServer(raw);
      if (seen[m.id]) return;
      if (m.who === 'me') { for (var i = 0; i < c.msgs.length; i++) if (c.msgs[i].pending && c.msgs[i].text === m.text) { c.msgs.splice(i, 1); break; } }
      if (m.who === 'op') typing = false;
      c.msgs.push(m); seen[m.id] = 1; c.last = raw.at;
      if (m.who !== 'me' && !isOpen()) c.unread = true;
    });
    store(c);
  }
  function state(conv) { if (!conv) return; c.ended = conv.status === 'closed'; if (conv.rating) c.rating = conv.rating; store(c); }
  function liveStart(topic) {
    c.started = true; c.email = email(); c.uid = me() ? me().id : ''; c.msgs = c.msgs || []; store(c);
    return call('POST', '/chat/start', { token: c.token || undefined, email: c.email || undefined, page: location.pathname, tz: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone })
      .then(function (r) {
        if (r.token) c.token = r.token;
        c.msgs = []; c.last = null; merge(r.messages || []); state(r.conversation);
        if (!c.msgs.length) c.msgs.push({ who: 'op', text: 'Hello! I\'m the Privet SIM AI assistant. How can I help? I\'ll bring in a human agent if needed.', meta: 'AI assistant', ts: Date.now() });
        store(c); render(); poll();
        if (topic) send(topic);
      })
      .catch(function () { c.started = false; store(c); push({ who: 'sys', text: 'Couldn\'t connect to support. Check your internet and try again' }); render(); });
  }
  function liveSend(text) {
    c.ended = false;
    push({ who: 'me', text: text, pending: true });
    typing = true; render();
    clearTimeout(typingTimer); typingTimer = setTimeout(function () { typing = false; render(); }, 45000);
    call('POST', '/chat/send', { token: c.token || undefined, text: text, page: location.pathname })
      .then(function (r) {
        if (r.rated) { c.rating = r.rated; c.msgs = c.msgs.filter(function (m) { return !m.pending; }); typing = false; store(c); render(); return; }
        state(r.conversation); poll();
      })
      .catch(function (e) {
        typing = false;
        c.msgs.forEach(function (m) { if (m.pending && m.text === text) { m.pending = false; m.failed = true; } });
        store(c); render();
        if (e.status === 401) { c.token = null; c.started = false; store(c); }
      });
  }
  // Long-poll: сервер держит запрос до 25 секунд и отвечает, как только появится сообщение
  function poll() {
    if (polling || !LIVE || !c.started) return;
    polling = true;
    (function loop() {
      if (!c.started) { polling = false; return; }
      var q = '/chat/poll?' + (c.token ? 'token=' + encodeURIComponent(c.token) + '&' : '') + (c.last ? 'after=' + encodeURIComponent(c.last) : '');
      call('GET', q).then(function (r) {
        merge(r.messages || []); state(r.conversation); render();
        setTimeout(loop, doc.hidden ? 15000 : 300);
      }).catch(function (e) {
        if (e.status === 404) { c = { email: c.email }; store(c); polling = false; render(); return; }
        setTimeout(loop, 5000);
      });
    })();
  }


  // Ответы помощника по ключевым словам (в рабочей версии — ИИ с доступом к заказам)
  var RULES = [
    [/спасиб|благодар|помогл|всё понятно|разобрал|thank|helped|got it/i, 'end'],
    [/оператор|человек|живой|специалист|agent|human|operator|person/i, 'op'],
    [/не (ловит|работает|подключ)|нет сети|интернет|роуминг|сеть|скорост|internet|roaming|network|signal|speed|not working/i, 'Please check: Settings → Cellular → Privet SIM → “Data Roaming” must be on, and the Privet SIM line must be selected for cellular data. If that doesn\'t help, write to me and I\'ll bring in a human agent.'],
    [/установ|qr|куар|скан|актив|install|scan|activat/i, 'Open “My eSIMs” → the eSIM you need → “QR and installation”. iPhones with iOS 17.4+ support one-tap installation. Install the eSIM the day before your flight while you have Wi‑Fi: the QR code is single-use.'],
    [/возврат|вернуть|верните|деньги назад|refund|money back/i, 'Request a refund on the eSIM page → “Purchase and top-ups” → “Refund”. If the eSIM wasn\'t installed, we\'ll refund the full amount to your balance right away. After installation, it\'s by request; we\'ll reply within 24 hours.'],
    [/оплат|сбп|usdt|крипт|карт|банк|списал|pay|sbp|crypto|card|bank|charged/i, 'You can pay via SBP (no fees), in USDT (TRON, TON, BEP-20) or from your balance. The payment link is valid for 30 minutes. If money was charged but the eSIM didn\'t arrive, send us the order number and we\'ll check.'],
    [/баланс|пополн|balance|top.?up/i, 'Top up your balance in your account → “Balance” via SBP or USDT and spend it on any eSIMs and gigabytes. To top up the eSIM itself, use the “Top up” button on its page.'],
    [/друг|реферал|приглас|20%|friend|referr|invite/i, 'The “Invite friends” section has your link and code. Your friend gets 100 ₽ off their first purchase with your code, and you get 20% of the cost of every eSIM they buy.'],
    [/телефон|поддерж|совмест|iphone|android|samsung|phone|support|compatib/i, 'You can check your phone on the “Compatibility” page: it has a list of models. It\'s important that the phone isn\'t carrier-locked.']
  ];
  function reply(text) {
    var r = null;
    for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(text)) { r = RULES[i][1]; break; }
    if (!r) { c.miss = (c.miss || 0) + 1; r = c.miss >= 2 ? 'op' : 'Could you clarify: is your question about installation, internet on your trip, payment or a refund? If you prefer, I\'ll bring in a human agent.'; }
    if (r === 'end') {
      push({ who: 'op', text: 'Glad I could help! Have a great trip.', meta: 'AI assistant' });
      push({ who: 'sysb', text: 'Chat ended · a copy was sent to' + NB + email() });
      c.ended = true; c.rating = 0; store(c); return;
    }
    if (r === 'op') {
      c.miss = 0;
      if (dayMsk()) {
        push({ who: 'op', text: 'Looks like you need a specialist. I\'m bringing in a human agent — they can already see our conversation.', meta: 'AI assistant' });
        later(2600, function () { push({ who: 'sys', text: 'Agent Anna has joined' }); push({ who: 'op', text: 'Hello, this is Anna. I\'m already looking at your question — I\'ll reply here and also send it to ' + email() + '.', meta: 'Anna · agent' }); });
      } else {
        push({ who: 'op', text: 'A human agent will handle this question. Agents work from 9:00 to 21:00 Moscow time. I\'ve passed on your question: the agent will reply in the morning, and the answer will arrive here and at ' + email() + '.', meta: 'AI assistant' });
        push({ who: 'sys', text: 'Your question is in the agent queue · we\'ll reply after 9:00 Moscow time' });
      }
      return;
    }
    push({ who: 'op', text: r, meta: 'AI assistant' });
  }
  function later(ms, fn) { typing = true; render(); setTimeout(function () { typing = false; fn(); if (!isOpen()) { c.unread = true; store(c); } render(); }, ms); }
  function send(text) {
    text = String(text || '').trim(); if (!text) return;
    if (LIVE) return liveSend(text);
    if (c.ended) { c.ended = false; c.rating = 0; }
    push({ who: 'me', text: text });
    later(1100, function () { reply(text); });
  }

  /* ---------- Отрисовка ---------- */
  function bubbles() {
    var h = '';
    (c.msgs || []).forEach(function (m) {
      if (m.img) h += '<a href="' + esc(m.img) + '" target="_blank" rel="noopener" class="cw-m ' + (m.who === 'me' ? 'cw-me' : 'cw-op') + '" style="padding: 4px"><img src="' + esc(m.img) + '" alt="Screenshot" style="display: block; max-width: 220px; max-height: 260px; border-radius: 14px"></a>';
      else if (m.who === 'me') h += '<div class="cw-m cw-me"' + (m.pending ? ' style="opacity: .6"' : '') + '>' + esc(m.text) + '</div>' + (m.failed ? '<span class="cw-meta" style="align-self: flex-end; color: #C62F35">Not sent. Check your internet</span>' : '');
      else if (m.who === 'op') h += '<div class="cw-m cw-op">' + esc(m.text) + '</div>' + (m.meta ? '<span class="cw-meta">' + esc(m.meta) + ' · ' + hm(m.ts) + '</span>' : '');
      else if (m.who === 'sysb') h += '<span class="cw-sys" style="background: #F2F5FF; color: #1F45D6">' + esc(m.text) + '</span>';
      else h += '<span class="cw-sys">' + OK + esc(m.text) + '</span>';
    });
    if (typing) h += '<span class="cw-m cw-op cw-typ" aria-label="Assistant is typing"><i></i><i></i><i></i></span>';
    if (c.ended) {
      h += '<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px; border-radius: 20px; background: #FFFFFF; margin-top: auto"><b style="font-size: 15px">' + (c.rating ? 'Thanks for your rating!' : 'How helpful was the answer?') + '</b><span style="display: flex; gap: 6px">';
      for (var i = 1; i <= 5; i++) { var on = i <= (c.rating || 0); h += '<button type="button" data-rate="' + i + '" aria-label="Rating ' + i + '" style="width: 36px; height: 36px; border: 0; border-radius: 12px; cursor: pointer; font: 600 14px/1 \'Onest\', system-ui, sans-serif; background: ' + (on ? '#FF7A45' : '#F5F6F9') + '; color: ' + (on ? '#FFFFFF' : '#8C92A3') + '">' + i + '</button>'; }
      h += '</span><span style="font-size: 12px; color: #8C92A3">Write again — we\'ll continue in the same chat</span></div>';
    }
    return h;
  }
  function intro() {
    return '<div class="cw-m cw-op">Hello! Leave your email — we\'ll use it to find your orders and eSIMs and reply by email, even if you close the site.</div><span class="cw-meta">Privet SIM · now</span>' +
      '<div style="display: flex; flex-direction: column; gap: 10px; margin-top: auto; padding: 14px; border-radius: 20px; background: #FFFFFF">' +
      '<label class="cw-in" data-mail style="box-shadow: inset 0 0 0 1.5px #2F5BFF">' + MAIL + '<input type="email" placeholder="name@mail.com" aria-label="Your email" value="' + esc(c.draftEmail || '') + '"></label>' +
      '<span data-err role="alert" style="display: none; font-size: 12px; color: #C62F35">Check your email — replies will be sent there</span>' +
      '<span style="font-size: 12px; color: #5A6175">What would you like to ask?</span><span class="cw-q">' +
      TOPICS.map(function (t, i) { var on = c.topic === i; return '<span role="button" tabindex="0" data-topic="' + i + '" aria-pressed="' + on + '" style="' + (on ? 'background: #2F5BFF; color: #FFFFFF; box-shadow: none' : '') + '">' + t + '</span>'; }).join('') + '</span>' +
      '<button type="button" class="cw-btn" data-start style="border: 0; width: 100%">Start chat</button>' +
      '<span style="font-size: 11px; line-height: 15px; color: #8C92A3">By clicking “Start chat”, you agree to the <a href="legal.html?doc=consent">processing of personal data</a></span></div>';
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
    // На главной в макете два экрана чата (форма гостя и переписка, переключаются чекбоксом).
    // Оставляем один — переписку с полем ввода, иначе после входа поле ввода спрятано
    var s1 = root.querySelector('.cw-s1'), s2 = root.querySelector('.cw-s2');
    if (s1 && s2) { s1.remove(); var cb = root.querySelector('.cw-go'); if (cb) cb.remove(); s2.style.display = 'flex'; }
    var st = doc.createElement('style'); st.textContent = '#dc-root details.cw{display:none !important}'; doc.head.appendChild(st);
    doc.body.appendChild(root);
    // Поле ввода и кнопки
    var input = root.querySelector('.cw-ft input'), sendBtn = root.querySelector('.cw-ft .cw-send'), clip = root.querySelector('.cw-ft .cw-ic');
    var file = doc.createElement('input'); file.type = 'file'; file.accept = 'image/*'; file.hidden = true; root.appendChild(file);
    var go = function () { var v = input.value; input.value = ''; if (!String(v).trim()) return; if (!c.started) start(v); else send(v); };
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    sendBtn.setAttribute('role', 'button'); sendBtn.tabIndex = 0; sendBtn.style.cursor = 'pointer';
    sendBtn.addEventListener('click', function (e) { e.preventDefault(); go(); });
    clip.setAttribute('role', 'button'); clip.tabIndex = 0; clip.style.cursor = 'pointer';
    clip.addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () {
      var f = file.files[0]; file.value = '';
      if (!f) return;
      if (!LIVE) { if (!c.started) start(); push({ who: 'me', text: 'Screenshot: ' + f.name }); later(1000, function () { push({ who: 'op', text: 'Thanks, we\'ve received the screenshot. We\'ll take a look and reply here.', meta: 'AI assistant' }); }); return; }
      if (f.size > 5 * 1024 * 1024 || !/^image\/(png|jpeg|webp|gif)$/.test(f.type)) { push({ who: 'sys', text: 'You can send a PNG, JPG or WebP image up to 5 MB' }); render(); return; }
      var up = function () { return call('POST', '/chat/upload?' + (c.token ? 'token=' + encodeURIComponent(c.token) + '&' : '') + 'name=' + encodeURIComponent(f.name), f, f.type).then(function () { poll(); }).catch(function () { push({ who: 'sys', text: 'The screenshot wasn\'t sent. Try again' }); render(); }); };
      if (!c.started) liveStart().then(up); else up();
    });
    // «Клиент печатает…» — оператор видит черновик в админке
    var tt = 0;
    input.addEventListener('input', function () { if (!LIVE || !c.started) return; clearTimeout(tt); tt = setTimeout(function () { call('POST', '/chat/typing', { token: c.token || undefined, text: input.value.slice(0, 500) }).catch(function () {}); }, 600); });
    // Гостевая форма
    root.querySelector('.cw-bd').addEventListener('click', function (e) {
      var t = e.target.closest('[data-topic]'), s = e.target.closest('[data-start]'), r = e.target.closest('[data-rate]');
      if (t) { c.topic = c.topic === +t.dataset.topic ? null : +t.dataset.topic; c.draftEmail = (root.querySelector('[data-mail] input') || {}).value || ''; store(c); render(); }
      if (s) {
        var v = (root.querySelector('[data-mail] input').value || '').trim();
        if (!PSA.validEmail || !PSA.validEmail(v)) { root.querySelector('[data-err]').style.display = ''; return; }
        c.email = v; var tp = c.topic != null ? TOPICS[c.topic] : ''; c.topic = null; start(tp); render();
      }
      if (r) { c.rating = +r.dataset.rate; store(c); render(); if (LIVE) call('POST', '/chat/rate', { token: c.token || undefined, rating: c.rating }).catch(function () {}); }
    });
    root.addEventListener('toggle', function () { if (root.open) { c.unread = false; store(c); if (me() && !c.started) start(); else if (c.started) poll(); render(); setTimeout(function () { var i = root.querySelector('.cw-ft input'); if (i && root.querySelector('.cw-ft').style.display !== 'none') i.focus(); }, 60); } else render(); });
    render();
    if (LIVE && c.started && c.token) poll();
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

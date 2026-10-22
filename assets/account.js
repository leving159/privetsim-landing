/*
  Личный кабинет: пользователи, вход (код из письма, Google, Telegram), eSIM, заказы, баланс, друзья, возвраты.
  Подключается после site.js и до runtime макетов. Экраны читают данные синхронно (PSA.*).

  Два режима (site-src/config.js):
    • demo: true — ДЕМО: «сервер» живёт в localStorage этого браузера, код входа показывается на экране,
      оплата СБП/USDT имитируется, статусы eSIM переключаются в демо-панели (кнопка «Демо» внизу слева);
    • demo: false — API-драйвер (внизу файла): данные из apps/api (SITE_CONFIG.apiUrl), вход по коду из письма, через Google и Telegram (в Mini App — сам),
      оплата на странице эквайринга. Перед показом страницы грузим /api/account/state (PSA.ready), а экраны
      читают те же структуры синхронно. Мутации возвращают Promise — экраны ждут их через PSA.then().
*/
(function (root) {
  'use strict';
  var PS = root.PS = root.PS || {};
  var PSA = root.PSA = {};
  var CFG = root.SITE_CONFIG || {};
  var KEY = 'ps.db.v1';
  var DAY = 864e5, MIN = 6e4;
  PSA.DEMO = CFG.demo !== false;
  var API = PSA.DEMO ? '' : String(CFG.apiUrl || '').replace(/\/$/, '') + '/api';
  // Результат функции PSA: в демо — сразу, с сервером — Promise
  PSA.then = function (r, fn) { return r && typeof r.then === 'function' ? r.then(fn) : fn(r); };
  // Данные загружены (в демо — сразу). Runtime макетов монтирует страницу после PSA.ready
  PSA.ready = Promise.resolve();
  PSA.whenReady = function (fn) { return PSA.DEMO ? fn() : PSA.ready.then(fn); };

  /* ================= Хранилище ================= */
  var mem = null;
  function blank() { return { v: 1, users: {}, byEmail: {}, codes: {}, sid: null, orders: {}, esims: {}, refs: {}, seq: { T: 0, R: 0 }, shift: 0 }; }
  function db() {
    if (mem) return mem;
    if (!PSA.DEMO) return (mem = blank());
    try { mem = JSON.parse(root.localStorage.getItem(KEY) || 'null'); } catch (e) { mem = null; }
    if (!mem || mem.v !== 1) mem = blank();
    return mem;
  }
  var subs = [];
  function save() {
    if (PSA.DEMO) try { root.localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {}
    subs.slice().forEach(function (f) { try { f(); } catch (e) {} });
  }
  PSA.sub = function (f) { subs.push(f); return function () { subs = subs.filter(function (x) { return x !== f; }); }; };
  // Другая вкладка изменила данные — перечитываем
  if (PSA.DEMO && root.addEventListener) root.addEventListener('storage', function (e) { if (e.key === KEY) { mem = null; db(); subs.slice().forEach(function (f) { try { f(); } catch (x) {} }); } });

  function now() { return Date.now() + (db().shift || 0); }
  PSA.now = now;
  function rid(n) { var a = '', s = 'abcdefghijkmnpqrstuvwxyz23456789'; for (var i = 0; i < (n || 12); i++) a += s[Math.floor(Math.random() * s.length)]; return a; }
  function digits(n) { var a = ''; for (var i = 0; i < n; i++) a += Math.floor(Math.random() * 10); return a; }
  function up(s) { return String(s || '').trim().toUpperCase(); }
  function normEmail(e) { return String(e || '').trim().toLowerCase(); }
  PSA.validEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim()); };
  function nextNo(k) { var d = db(); d.seq[k] = (d.seq[k] || 0) + 1; return k + '-' + String(d.seq[k]).padStart(4, '0'); }

  /* ================= Форматирование ================= */
  var MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var NB = ' ';
  PSA.rub = function (n) { return (n < 0 ? '−' : '') + PS.fmt(Math.abs(Math.round(n))) + NB + '₽'; };
  PSA.d = function (ts) { var d = new Date(ts); return d.getDate() + NB + MON[d.getMonth()]; };
  PSA.dy = function (ts) { var d = new Date(ts); return PSA.d(ts) + (d.getFullYear() !== new Date(now()).getFullYear() ? ' ' + d.getFullYear() : ''); };
  PSA.dnum = function (ts) { var d = new Date(ts); return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear(); };
  PSA.hm = function (ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  PSA.dt = function (ts) { return PSA.d(ts) + ', ' + PSA.hm(ts); };
  PSA.gb = function (n) {
    n = Math.max(0, n);
    // 0,49 ГБ тарифа → «500 МБ», как в каталоге и боте; расход (123 МБ) — без округления
    if (n > 0 && n < 1) { var mb = n * 1024, r50 = Math.round(mb / 50) * 50; return (r50 && Math.abs(mb - r50) <= mb * 0.02 ? r50 : Math.round(mb)) + NB + 'МБ'; }
    var r = Math.round(n * 100) / 100;
    return String(r % 1 ? r.toFixed(r * 10 % 1 ? 2 : 1) : r).replace('.', ',') + NB + 'ГБ';
  };
  PSA.gbShort = function (n) { return PSA.gb(n).replace(NB + 'ГБ', '').replace(NB + 'МБ', NB + 'МБ'); };
  PSA.days = function (n) { return PS.daysWord(n); };
  PSA.mask = function (email) { var p = String(email).split('@'); return (p[0] || '').charAt(0) + '•••••@' + (p[1] || ''); };
  PSA.plural = function (n, a, b, c) { return n % 10 === 1 && n % 100 !== 11 ? a : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? b : c); };

  /* ================= Пользователь и сессия ================= */
  function refCode() { var s = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', c; do { c = 'PRIVET-'; for (var i = 0; i < 4; i++) c += s[Math.floor(Math.random() * s.length)]; } while (db().refs[c]); return c; }
  function newUser(email) {
    var d = db(), id = 'u_' + rid(10);
    var u = { id: id, email: email, created: now(), ref: refCode(), invitedBy: null, bal: 0, bonus: 0, emails: [], ops: [],
      set: { lang: 'ru', mlang: 'ru', cur: 'rub', nt: { low: [1, 1], exp: [1, 1], act: [0, 1], top: [1, 1], pay: [1, 1], inst: [1, 1], promo: [0, 0], dest: [0, 1], ref: [1, 1] }, expAt: 1, quiet: true, auto: false, balFirst: false, tg: false, g: false } };
    d.users[id] = u; d.byEmail[email] = id; d.refs[u.ref] = id;
    return u;
  }
  function userByEmail(email) { var d = db(), id = d.byEmail[normEmail(email)]; return id ? d.users[id] : null; }
  PSA.user = function () { var d = db(); return d.sid && d.users[d.sid] || null; };
  PSA.authed = function () { return !!PSA.user(); };
  PSA.hasAccount = function (email) { return !!userByEmail(email); };
  PSA.logout = function () { db().sid = null; save(); try { root.localStorage.removeItem('ps.chat.v2'); } catch (e) {} };
  PSA.loginUrl = function (next) { return 'login.html' + (next ? '?next=' + encodeURIComponent(next) : ''); };
  /* ---------- Вход через Telegram и Google (работают с сервером; в демо — подсказка) ---------- */
  PSA.providers = function () { return { google: false, telegram: false }; };
  PSA.googlePending = function () { return ''; };
  PSA.googleUrl = function () { return ''; };
  PSA.tgStart = function (link, cb) { cb({ status: 'off' }); };
  PSA.tgCancel = function () {};
  PSA.unlink = function () { return { err: 'off' }; };
  var AUTH_ERR = {
    google_cancelled: 'Попробуйте ещё раз или войдите по коду из письма.',
    google_failed: 'Попробуйте ещё раз или войдите по коду из письма.',
    google_unverified: 'Google не подтвердил почту этого аккаунта. Войдите по коду из письма.',
    google_off: 'Вход через Google временно недоступен. Войдите по коду из письма',
    identity_conflict: 'Этот вход привязан к другому кабинету, где уже есть свой Telegram или Google. Напишите в поддержку — объединим вручную',
    already_linked: 'К кабинету уже привязан другой Google-аккаунт. Сначала отвяжите его в профиле',
    auth: 'Сначала войдите в кабинет'
  };
  PSA.authError = function (code) { return AUTH_ERR[code] || ''; };
  // Первый экран входа: после Google — «Этот email у нас уже есть» (site-29, 08) или «Вход через Google отменён» (07)
  PSA.loginStep = function () {
    if (PS.qp('merge') === 'google' && PSA.googlePending()) return 'merge';
    var e = PS.qp('error');
    return e && e !== 'google_off' && AUTH_ERR[e] ? 'gFail' : 'email';
  };
  // Сообщение после возврата из Google в профиль (?linked=google / ?error=…)
  PSA.authMessage = function () {
    if (PS.qp('linked') === 'google') return 'Google привязан — теперь можно входить в один клик';
    return PSA.authError(PS.qp('error'));
  };
  // Страницы кабинета без входа ведут на вход и возвращают обратно
  PSA.guard = function () {
    return PSA.whenReady(function () {
      if (PSA.authed()) return true;
      var here = root.location.pathname.split('/').pop() + root.location.search + root.location.hash;
      PSA.leaving = true; // страницу не монтируем — уходим на вход
      root.location.replace(PSA.loginUrl(here));
      return false;
    });
  };
  PSA.nextUrl = function () {
    var n = PS.qp('next');
    return n && /^[a-z0-9-]+\.html/i.test(n) ? n : 'account.html';
  };

  /* ---------- Вход по коду из письма ---------- */
  // Лимиты как в макете «Слишком много попыток»: не чаще раза в 60 секунд, не больше 5 в час; 3 попытки ввода
  PSA.RESEND = 60;
  PSA.codeWait = function (email) {
    var c = db().codes[normEmail(email)];
    if (!c) return 0;
    return Math.max(0, Math.ceil((c.sent[c.sent.length - 1] + PSA.RESEND * 1000 - now()) / 1000));
  };
  PSA.requestCode = function (email, purpose) {
    email = normEmail(email);
    var d = db(), c = d.codes[email] || { sent: [] };
    var t = now();
    c.sent = c.sent.filter(function (x) { return t - x < 3600e3; });
    var wait = c.sent.length ? Math.ceil((c.sent[c.sent.length - 1] + PSA.RESEND * 1000 - t) / 1000) : 0;
    if (wait > 0) return { err: 'wait', wait: wait };
    if (c.sent.length >= 5) return { err: 'hour', wait: Math.ceil((c.sent[0] + 3600e3 - t) / 1000) };
    c.code = digits(6); c.exp = t + 10 * MIN; c.tries = 3; c.purpose = purpose || 'login';
    c.sent.push(t);
    d.codes[email] = c; save();
    PSA.mail(email, 'Код входа: ' + c.code, 'Ваш код: ' + c.code + '. Он действует 10 минут.');
    return { ok: true, code: c.code, wait: PSA.RESEND };
  };
  // Последний отправленный код (для демо-подсказки на экране)
  PSA.demoCode = function (email) { var c = db().codes[normEmail(email)]; return PSA.DEMO && c && c.exp > now() ? c.code : ''; };
  PSA.checkCode = function (email, code) {
    email = normEmail(email);
    var d = db(), c = d.codes[email];
    if (!c || !c.code) return { err: 'nocode' };
    if (c.tries <= 0) return { err: 'locked' };
    if (c.exp < now()) return { err: 'expired' };
    if (String(code) !== c.code) { c.tries--; save(); return c.tries > 0 ? { err: 'invalid', left: c.tries } : { err: 'locked' }; }
    c.code = ''; save();
    return { ok: true };
  };
  PSA.refValid = function (code) { return !!db().refs[up(code)]; };
  PSA.verifyLogin = function (email, code, ref) {
    var r = PSA.checkCode(email, code);
    if (!r.ok) return r;
    email = normEmail(email);
    var d = db(), u = userByEmail(email), isNew = !u;
    if (!u) {
      u = newUser(email);
      var inv = ref && d.refs[up(ref)];
      if (inv && inv !== u.id) u.invitedBy = inv;
    }
    u.verified = true;
    d.sid = u.id;
    // Гостевые заказы на этот email переходят в кабинет
    Object.keys(d.orders).forEach(function (k) { var o = d.orders[k]; if (!o.userId && normEmail(o.email) === email) o.userId = u.id; });
    Object.keys(d.esims).forEach(function (k) { var e = d.esims[k], o = d.orders[e.orderId]; if (!e.userId && o && o.userId === u.id) e.userId = u.id; });
    try { root.localStorage.removeItem('ps.ref'); } catch (e) {}
    save();
    return { ok: true, isNew: isNew, invited: !!u.invitedBy };
  };
  // Код друга из ссылки (?r=CODE, старые ссылки — ?ref=CODE) запоминаем до регистрации.
  // ?r= на странице региона — это код региона (region.html?r=EU), его не трогаем
  PSA.REF_RE = /^[A-Z]+-[A-Z0-9]{4,}$/;
  PSA.pendingRef = function () { try { return root.localStorage.getItem('ps.ref') || ''; } catch (e) { return ''; } };
  (function () {
    var r = PS.qp && (PS.qp('ref') || PS.qp('r'));
    if (r && PSA.REF_RE.test(up(r))) try { root.localStorage.setItem('ps.ref', up(r)); } catch (e) {}
  })();

  /* ---------- Демо-«почта»: письма показываются уведомлением ---------- */
  PSA.mail = function (to, subject, text) {
    if (!PSA.DEMO || !root.document) return;
    var show = function () { PSA.notice('Письмо на ' + to, subject, text); };
    if (root.document.body) setTimeout(show, 50); else root.addEventListener('DOMContentLoaded', show);
  };

  /* ================= eSIM ================= */
  var SMDP = 'rsp.esimaccess.com';
  function actCode() { var s = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789', a = []; for (var j = 0; j < 5; j++) { var p = ''; for (var i = 0; i < 4; i++) p += s[Math.floor(Math.random() * s.length)]; a.push(p); } return a.join('-'); }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function info(code) { // название, флаг, фото направления
    var isReg = PS.isRegion(code) && !(root.PS_CATALOG && root.PS_CATALOG.countries[code]);
    var i = isReg ? PS.region(code) : PS.country(code);
    return { name: i.name, flag: isReg ? i.icon : i.flag, photo: i.photo, isRegion: isReg, net: i.net || '4G' };
  }
  PSA.place = info;

  function makeEsim(o, idx) {
    var d = db(), id = 'e_' + rid(10), act = actCode();
    var e = { id: id, orderId: o.id, userId: o.userId, code: o.code, pkg: o.pkg, n: o.n, d: o.d, t: o.t, top: o.top,
      iccid: '8985' + digits(15), act: act, ac: 'LPA:1$' + SMDP + '$' + act.replace(/-/g, ''), smdpAddr: SMDP,
      created: now(), installBy: now() + 180 * DAY, smdp: 'RELEASED', installedAt: 0, activatedAt: 0, expiresAt: 0,
      extraUsed: 0, topups: [], sentTo: '', n0: o.n, idx: idx || 0 };
    d.esims[id] = e;
    return e;
  }

  // Расход по дням (демо): детерминированно от id eSIM и дня
  function dayUse(e, i) {
    var avg = e.n / Math.max(1, e.d) * 0.7;
    return Math.round(avg * (0.4 + (hash(e.id + ':' + i) % 1000) / 830) * 100) / 100;
  }
  function usage(e, t) {
    if (e.real) return { used: Math.min(e.n, Math.round((e.used || 0) * 100) / 100), days: [] }; // с сервера: расход без разбивки по дням
    if (!e.activatedAt) return { used: 0, days: [] };
    var end = Math.min(t, e.expiresAt || t), n = Math.max(0, Math.floor((end - e.activatedAt) / DAY)) + 1, used = 0, days = [];
    for (var i = 0; i < Math.min(n, 400); i++) { var v = dayUse(e, i); if (i === n - 1) v = Math.round(v * Math.min(1, ((end - e.activatedAt) % DAY) / DAY + 0.15) * 100) / 100; used += v; days.push({ ts: e.activatedAt + i * DAY, v: v }); }
    used += e.extraUsed || 0;
    if (days.length) days[days.length - 1].v += e.extraUsed || 0;
    return { used: Math.min(e.n, Math.round(used * 100) / 100), days: days };
  }

  // Статус как в макете «Все статусы eSIM» (site-26)
  var ST = {
    new: ['Ждёт установки', 'blue'], failed: ['Не установилась', 'amber'], installed: ['Установлена', 'blue'], active: ['Активна', 'green'],
    low: ['Мало трафика', 'amber'], usedup: ['Трафик закончился', 'red'], expired: ['Истекла', 'gray'], burned: ['Сгорела', 'gray'],
    deleted: ['Удалена', 'gray'], disabled: ['Выключена в телефоне', 'amber'], refunded: ['Возвращена', 'gray'], blocked: ['Заблокирована', 'red']
  };
  PSA.PILL = { blue: ['#F2F5FF', '#1F45D6'], green: ['#E4F5EA', '#0B7A3E'], amber: ['#FFF6E5', '#8A5300'], red: ['#FDECEC', '#B0262C'], gray: ['#EDEFF3', '#5A6175'] };
  function status(e, used, t) {
    if (e.refund && e.refund.status === 'approved') return 'refunded';
    if (e.blocked) return 'blocked';
    if (e.smdp === 'DELETED') return 'deleted';
    if (!e.installedAt) { if (t > e.installBy) return 'burned'; return e.smdp === 'DOWNLOAD' ? 'failed' : 'new'; }
    if (!e.activatedAt) return e.smdp === 'DISABLED' ? 'disabled' : 'installed';
    if (t > e.expiresAt) return 'expired';
    if (e.smdp === 'DISABLED') return 'disabled';
    if (used >= e.n - 0.001) return 'usedup';
    if ((e.n - used) / e.n <= 0.25) return 'low';
    return 'active';
  }
  PSA.FINISHED = { expired: 1, burned: 1, deleted: 1, refunded: 1 };

  function esimView(e) {
    var t = now(), u = usage(e, t), st = status(e, u.used, t), I = info(e.code), left = Math.max(0, e.n - u.used);
    var o = db().orders[e.orderId] || {};
    var daysLeft = e.activatedAt ? Math.max(0, Math.ceil((e.expiresAt - t) / DAY)) : e.d;
    var pc = e.n ? Math.round(left / e.n * 100) : 0;
    return {
      id: e.id, raw: e, order: o, code: e.code, name: I.name, flag: I.flag, photo: I.photo, net: I.net, isRegion: I.isRegion,
      label: I.name + ' · ' + PSA.gb(e.n0) + ' · ' + PSA.days(e.d), short: I.name + ' · ' + PSA.gb(e.n0),
      card: ('ESIM · ' + PSA.gb(e.n) + ' · ' + e.d + ' ДН').toUpperCase(),
      st: st, stText: ST[st][0], stColor: ST[st][1], pill: PSA.PILL[ST[st][1]],
      total: e.n, used: u.used, left: left, pc: pc, days: u.days, daysLeft: daysLeft,
      iccid: e.iccid, iccidShort: '···· ' + e.iccid.slice(-4), iccidFull: e.iccid.replace(/(\d{4})(?=\d)/g, '$1 '),
      ac: e.ac, act: e.act, smdpAddr: e.smdpAddr, installUrl: 'https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=' + encodeURIComponent(e.ac),
      created: e.created, installBy: e.installBy, installedAt: e.installedAt, activatedAt: e.activatedAt, expiresAt: e.expiresAt,
      canTopup: e.top !== 0 && { active: 1, low: 1, usedup: 1, installed: 1, new: 1, disabled: 1 }[st] === 1,
      canSend: st === 'new' && !e.sentTo, canRefund: !PSA.FINISHED[st] && st !== 'blocked' && !(e.refund && e.refund.status !== 'rejected'),
      waiting: st === 'new' || st === 'failed', live: { installed: 1, active: 1, low: 1, usedup: 1, disabled: 1, blocked: 1 }[st] === 1,
      archived: PSA.FINISHED[st] === 1, refund: e.refund || null, sentTo: e.sentTo || '', topups: e.topups,
      href: 'esim.html?id=' + e.id, qrHref: 'order.html?id=' + e.id, buyHref: PS.dest(e.code)
    };
  }
  PSA.esimView = esimView;
  function mine(list) { var u = PSA.user(); return u ? list.filter(function (x) { return x.userId === u.id; }) : []; }
  function values(o) { return Object.keys(o).map(function (k) { return o[k]; }); }
  PSA.esims = function () {
    return mine(values(db().esims)).sort(function (a, b) { return b.created - a.created; }).map(esimView);
  };
  PSA.esim = function (id) {
    var e = db().esims[id];
    if (!e) return null;
    var u = PSA.user();
    return (u && e.userId === u.id) || PSA.canSeeOrder(e.orderId) ? esimView(e) : null;
  };
  // Пустышка, пока страница уходит на другой адрес (чтобы шаблон не упал)
  PSA.stubEsim = function () { return esimView({ id: 'stub', orderId: '', code: 'TR', n: 1, n0: 1, d: 7, iccid: '0000000000000000000', act: '', ac: 'LPA:1$x$x', smdpAddr: SMDP, created: now(), installBy: now() + DAY, smdp: 'RELEASED', topups: [] }); };
  // Заказы eSIM: покупка и пополнения
  PSA.esimOrders = function (id) {
    var d = db(), e = d.esims[id]; if (!e) return [];
    return values(d.orders).filter(function (o) { return (o.id === e.orderId) || (o.kind === 'topup' && o.esimId === id && { paid: 1, refunded: 1 }[o.status]); })
      .sort(function (a, b) { return a.created - b.created; });
  };
  // Главная активная eSIM для шапки (чип «2,6 ГБ · 9 дн»)
  PSA.mainEsim = function () {
    var l = PSA.esims().filter(function (e) { return e.live; });
    return l[0] || null;
  };

  /* ================= Заказы и оплата ================= */
  PSA.PROMO = { TRIP10: { pc: 10 }, SUMMER25: { expired: true } };
  PSA.checkPromo = function (code) {
    var p = PSA.PROMO[up(code)];
    if (!p) return { err: 'Такого промокода нет. Проверьте буквы и цифры' };
    if (p.expired) return { err: 'Срок действия промокода закончился' };
    return { ok: true, code: up(code), pc: p.pc };
  };
  PSA.balance = function () {
    var u = PSA.user();
    if (!u) return { own: 0, bonus: 0, total: 0, pending: 0 };
    var pend = u.ops.filter(function (o) { return o.pend; }).reduce(function (s, o) { return s + o.a; }, 0);
    return { own: u.bal, bonus: u.bonus, total: u.bal + u.bonus, pending: pend };
  };
  function addOp(u, op) { op.id = 'op_' + rid(8); op.ts = op.ts || now(); u.ops.unshift(op); return op; }
  // Списание с баланса: сначала бонусы, потом собственные
  function spend(u, amount) {
    var b = Math.min(u.bonus, amount); u.bonus -= b; u.bal -= amount - b;
    return { fromBonus: b, fromOwn: amount - b };
  }

  /*
    Новый заказ. p: { kind: 'esim'|'topup'|'balance', code, pkg, d (для суточных), qty, email, method: 'sbp'|'usdt'|'balance',
                      useBal (₽ с баланса при оплате СБП/USDT), promo, esimId (пополнение), amount (пополнение баланса) }
  */
  PSA.createOrder = function (p) {
    var d = db(), u = PSA.user(), o = { id: 'o_' + rid(12), token: rid(16), created: now(), status: 'pending', kind: p.kind || 'esim', method: p.method || 'sbp', qty: 1 };
    o.no = nextNo('T');
    o.userId = u ? u.id : null;
    o.email = normEmail(p.email || (u && u.email) || '');
    if (o.kind === 'balance') {
      o.sum = Math.round(p.amount); o.label = 'Пополнение баланса'; o.disc = 0;
    } else {
      var code = up(p.code), plan = PS.findPlan(code, p.pkg), I = info(code);
      var days = plan.t === 'daily' ? Math.min(90, Math.max(1, parseInt(p.d, 10) || 10)) : parseInt(plan.p.daysShort, 10);
      var unit = plan.t === 'daily' ? plan.p.price * days : plan.p.price;
      o.code = code; o.pkg = plan.p.code; o.t = plan.t; o.d = days; o.n = plan.t === 'daily' ? plan.p.n * days : plan.p.n;
      o.top = plan.p.top; o.name = I.name; o.qty = o.kind === 'topup' ? 1 : Math.min(10, Math.max(1, p.qty || 1));
      o.unit = unit; o.gbLabel = plan.t === 'daily' ? plan.p.gb : PSA.gb(plan.p.n);
      o.label = o.kind === 'topup' ? 'Пополнение ' + I.name + ' · +' + PSA.gb(o.n) : I.name + ' · ' + o.gbLabel + ' · ' + PSA.days(days);
      o.esimId = p.esimId || null;
      var gross = unit * o.qty, pr = p.promo ? PSA.checkPromo(p.promo) : null;
      o.promo = pr && pr.ok ? pr.code : ''; o.disc = pr && pr.ok ? Math.round(gross * pr.pc / 100) : 0;
      o.sum = gross - o.disc;
    }
    o.fromBal = 0;
    if (u && o.kind !== 'balance') {
      var b = PSA.balance().total;
      if (o.method === 'balance') o.fromBal = Math.min(b, o.sum);
      else if (p.useBal) o.fromBal = Math.min(b, Math.max(0, Math.round(p.useBal)), o.sum);
    }
    o.toPay = o.sum - o.fromBal;
    if (o.toPay <= 0) o.method = 'balance';
    o.usdt = p.usdt || PSA.toUsdt(o.toPay); o.net = p.net || '';
    o.payBy = now() + 30 * MIN;
    d.orders[o.id] = o; save();
    if (o.toPay <= 0) PSA.confirmPayment(o.id);
    return o;
  };
  // Уникальная сумма USDT: 4 знака после запятой (так узнаём перевод)
  PSA.toUsdt = function (rub) { return Math.ceil(rub / (PS.USDT_RATE || 87) * 100) / 100 + (Math.floor(Math.random() * 90) + 10) / 10000; };
  PSA.usdtStr = function (x) { return x.toFixed(4).replace('.', ','); };
  PSA.canSeeOrder = function (id, token) {
    var o = db().orders[id], u = PSA.user();
    if (!o) return false;
    if (u && o.userId === u.id) return true;
    var k = token || PS.qp('k');
    if (k && k === o.token) return true;
    try { return (JSON.parse(root.sessionStorage.getItem('ps.guest') || '[]')).indexOf(id) !== -1; } catch (e) { return false; }
  };
  PSA.order = function (id) { return PSA.canSeeOrder(id) ? db().orders[id] : null; };
  PSA.orderStatus = function (o) {
    if (o.status === 'pending' && now() > o.payBy) { o.status = 'expired'; save(); }
    return o.status;
  };
  PSA.payUrl = function (o) { return 'payment.html?o=' + o.id + '&k=' + o.token; };
  PSA.doneUrl = function (o) {
    if (o.kind === 'balance') return 'wallet.html?paid=' + o.id;
    if (o.kind === 'topup') return 'esim.html?id=' + o.esimId + '&paid=' + o.id;
    return 'order.html?o=' + o.id + '&k=' + o.token;
  };
  function rememberGuest(o) { try { var l = JSON.parse(root.sessionStorage.getItem('ps.guest') || '[]'); l.push(o.id); root.sessionStorage.setItem('ps.guest', JSON.stringify(l)); } catch (e) {} }

  // Банк/блокчейн подтвердил оплату: выдаём eSIM, начисляем, пишем письма
  PSA.confirmPayment = function (id) {
    var d = db(), o = d.orders[id];
    if (!o || o.status === 'paid') return o;
    var late = o.status === 'expired' || o.status === 'cancelled';
    var u = o.userId ? d.users[o.userId] : null;
    if (!u && o.email) {
      // Гость: кабинет создаётся на email заказа (вход — по коду)
      u = userByEmail(o.email) || newUser(o.email);
      o.userId = u.id;
      var pr = PSA.pendingRef(), inv = pr && d.refs[pr];
      if (inv && inv !== u.id && !u.invitedBy && !values(d.orders).some(function (x) { return x.userId === u.id && x.status === 'paid'; })) u.invitedBy = inv;
      rememberGuest(o);
    }
    o.paidAt = now();
    if (late) {
      // Оплата пришла после отмены — деньги на баланс (site-27, состояние 06)
      o.status = 'late'; u.bal += o.toPay;
      addOp(u, { t: 'Оплата пришла после отмены заказа ' + o.no, d: PSA.dt(now()) + ' · зачислили на баланс', b: 'main', a: o.toPay, kind: 'in' });
      save(); return o;
    }
    o.status = 'paid';
    if (o.fromBal) { spend(u, o.fromBal); }
    var METH = { sbp: 'СБП', usdt: 'USDT', balance: 'с баланса' };
    if (o.kind === 'balance') {
      u.bal += o.sum;
      addOp(u, { t: 'Пополнение · ' + (o.method === 'usdt' ? 'USDT ' + (o.net || 'TRON') : 'СБП'), d: PSA.dt(now()) + (o.method === 'usdt' ? ' · ' + PSA.usdtStr(o.usdt) + ' USDT по курсу ' + String(PS.USDT_RATE).replace('.', ',') + ' ₽' : ''), b: 'main', a: o.sum, kind: 'in', orderId: o.id });
      PSA.mail(u.email, 'Баланс пополнен на ' + PSA.rub(o.sum), 'Квитанция ' + o.no);
    } else if (o.kind === 'topup') {
      var e = d.esims[o.esimId];
      if (e) { e.n += o.n; e.topups.push(o.id); if (e.activatedAt && e.t === 'daily') e.expiresAt += o.d * DAY; }
      if (o.fromBal) addOp(u, { t: 'Пополнение eSIM ' + o.name + ' · +' + PSA.gb(o.n), d: PSA.d(now()) + ' · с баланса', b: 'main', a: -o.fromBal, kind: 'out', orderId: o.id });
      PSA.mail(u.email, 'eSIM ' + o.name + ': +' + PSA.gb(o.n), 'Пополнение ' + o.no + ' зачислено');
    } else {
      o.esimIds = [];
      for (var i = 0; i < o.qty; i++) { var es = makeEsim(o, i); es.userId = u.id; o.esimIds.push(es.id); }
      if (o.fromBal) addOp(u, { t: 'eSIM ' + o.label, d: PSA.dt(now()) + ' · оплата с баланса, без комиссии', b: 'main', a: -o.fromBal, kind: 'out', orderId: o.id });
      PSA.mail(o.email, 'eSIM ' + o.name + ' готова к установке', 'QR-код и инструкция · заказ ' + o.no);
    }
    // 25% пригласившему — от суммы, оплаченной деньгами (без баланса и скидок), начислим после окончания eSIM
    var paidMoney = o.kind === 'balance' ? 0 : o.toPay;
    if (u.invitedBy && paidMoney > 0 && d.users[u.invitedBy]) {
      var r = d.users[u.invitedBy], amt = Math.round(paidMoney * 0.25);
      o.reward = { to: r.id, amount: amt, status: 'pending' };
      addOp(r, { t: '25% с заказа друга · ожидает', d: PSA.d(now()) + ' · ' + PSA.mask(u.email) + ' купил eSIM · начислим после окончания её срока', b: 'bonus', a: amt, kind: 'gift', pend: true, orderId: o.id });
    }
    save();
    return o;
  };
  PSA.failPayment = function (id) { var o = db().orders[id]; if (o && o.status === 'pending') { o.status = 'failed'; save(); } return o; };
  PSA.cancelOrder = function (id) { var o = db().orders[id]; if (o && o.status === 'pending') { o.status = 'cancelled'; save(); } return o; };

  // Начисления, которые ждут окончания eSIM: бонус пригласившему и 100 ₽ другу за первую eSIM
  PSA.settle = function () {
    var d = db(), changed = false;
    values(d.orders).forEach(function (o) {
      if (o.status !== 'paid' || o.kind !== 'esim' || !o.esimIds) return;
      var done = o.esimIds.every(function (id) { var e = d.esims[id]; return e && PSA.FINISHED[status(e, usage(e, now()).used, now())]; });
      if (!done) return;
      var refunded = o.esimIds.some(function (id) { var e = d.esims[id]; return e.refund && e.refund.status === 'approved'; });
      if (o.reward && o.reward.status === 'pending') {
        var r = d.users[o.reward.to];
        o.reward.status = refunded ? 'cancelled' : 'paid';
        if (r) r.ops.forEach(function (op) {
          if (op.orderId === o.id && op.pend) {
            op.pend = false;
            if (refunded) { op.t = '25% с заказа друга · отменено'; op.a = 0; op.cancel = true; }
            else { op.t = '25% с заказа друга'; r.bonus += op.a; }
          }
        });
        changed = true;
      }
      var u = d.users[o.userId];
      if (u && u.invitedBy && !u.welcomePaid && !refunded) {
        u.welcomePaid = true; u.bonus += 100;
        addOp(u, { t: 'Подарок от друга за первую eSIM', d: PSA.d(now()) + ' · по приглашению', b: 'bonus', a: 100, kind: 'gift' });
        changed = true;
      }
    });
    // Автопополнение: при 25% трафика докупаем +1 ГБ с баланса (настройка в «Способах оплаты»)
    var me = PSA.user();
    if (me && me.set.auto) values(d.esims).forEach(function (e) {
      if (e.userId !== me.id || e.autoAt) return;
      var v = esimView(e); if (v.st !== 'low' || !v.canTopup) return;
      var p = PSA.topupPlans(e.id).filter(function (x) { return x.n >= 1; })[0];
      if (!p || PSA.balance().total < p.price) return;
      e.autoAt = now();
      PSA.createOrder({ kind: 'topup', code: e.code, pkg: p.code, esimId: e.id, method: 'balance' });
      changed = true;
    });
    if (changed) save();
  };

  PSA.orders = function () {
    var u = PSA.user(); if (!u) return [];
    return values(db().orders).filter(function (o) { return o.userId === u.id && { paid: 1, refunded: 1, late: 1 }[o.status]; })
      .sort(function (a, b) { return b.created - a.created; });
  };
  PSA.payName = function (o) { return o.method === 'balance' ? 'С баланса' : (o.method === 'usdt' ? 'USDT' : 'СБП') + (o.fromBal ? ' + баланс' : ''); };
  PSA.receipt = function (o) {
    return { no: '#' + o.no, date: PSA.dnum(o.paidAt || o.created), item: (o.kind === 'esim' ? 'eSIM ' : '') + o.label + (o.qty > 1 ? ' × ' + o.qty : ''), pay: PSA.payName(o), sum: PSA.rub(o.sum), file: o.no };
  };

  // Квитанция для печати / «Сохранить как PDF»
  PSA.printReceipt = function (id) {
    var o = db().orders[id]; if (!o) return;
    var r = PSA.receipt(o), seller = (PS.sellerLine && PS.sellerLine().replace(/^ · /, '')) || 'Привет SIM';
    var esc = function (x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var row = function (k, v) { return '<tr><td>' + esc(k) + '</td><td>' + esc(v) + '</td></tr>'; };
    var w = root.open('', '_blank');
    if (!w) return;
    w.document.write('<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Квитанция ' + esc(r.no) + '</title><style>body{font:15px/1.5 Onest,system-ui,sans-serif;color:#0E1220;max-width:560px;margin:48px auto;padding:0 24px}h1{font-size:24px;margin:0 0 4px}p{color:#5A6175;margin:0 0 24px}table{width:100%;border-collapse:collapse}td{padding:10px 0;border-bottom:1px solid #EDEFF3}td+td{text-align:right;font-weight:600}</style></head><body><h1>Квитанция об оплате</h1><p>' + esc(r.no) + ' · ' + esc(r.date) + '</p><table>' +
      row('Товар', r.item) + row('Способ оплаты', r.pay) + row('Сумма', r.sum.replace(/\u00a0/g, ' ')) + row('Статус', o.status === 'refunded' ? 'Возвращено' : 'Оплачено') + row('Покупатель', o.email) + row('Продавец', seller) +
      '</table><script>print()<\/script></body></html>');
    w.document.close();
  };

  /* ---------- Пополнение eSIM, отправка другу ---------- */
  PSA.topupPlans = function (esimId) {
    var e = db().esims[esimId]; if (!e) return [];
    var pl = PS.plans(e.code), list = (e.t === 'daily' ? pl.daily : pl.total).filter(function (p) { return p.code && !p.more; });
    if (list.length < 3) list = (e.t === 'daily' ? pl.daily : pl.total);
    return list.slice(0, 6);
  };
  PSA.sendToFriend = function (esimId, email, msg) {
    var e = db().esims[esimId]; if (!e) return { err: 'nf' };
    e.sentTo = normEmail(email); e.sentMsg = msg || ''; e.sentAt = now(); save();
    PSA.mail(email, 'Вам отправили eSIM ' + info(e.code).name, 'QR-код и инструкция по установке');
    return { ok: true };
  };

  /* ---------- Возврат (site-28) ---------- */
  // Неустановленная eSIM или неиспользованное пополнение — сразу на баланс; иначе заявка R-XXXX
  PSA.refundInfo = function (orderId) {
    var d = db(), o = d.orders[orderId]; if (!o) return null;
    var e = o.kind === 'topup' ? d.esims[o.esimId] : d.esims[(o.esimIds || [])[0]];
    var v = e ? esimView(e) : null;
    var instant = o.kind === 'topup' ? (v && v.left >= o.n - 0.001 && !PSA.FINISHED[v.st]) : (v && v.st === 'new');
    var amount = o.kind === 'esim' && o.qty > 1 ? Math.round(o.sum / o.qty) : o.sum;
    return { order: o, esim: v, instant: !!instant, amount: amount, used: !instant };
  };
  PSA.refund = function (orderId, reason, text) {
    var d = db(), ri = PSA.refundInfo(orderId), u = PSA.user();
    if (!ri || !u) return { err: 'nf' };
    var o = ri.order, e = ri.esim && d.esims[ri.esim.id];
    var r = { no: nextNo('R'), reason: reason, text: text || '', ts: now(), amount: ri.amount, orderId: o.id, kind: o.kind };
    if (ri.instant) {
      r.status = 'approved'; r.decided = now(); r.instant = true;
      u.bal += ri.amount;
      addOp(u, { t: 'Возврат ' + r.no + ' · ' + o.label, d: PSA.dt(now()) + ' · на баланс', b: 'main', a: ri.amount, kind: 'in' });
      if (o.kind === 'topup') { if (e) { e.n -= o.n; e.topups = e.topups.filter(function (x) { return x !== o.id; }); } o.status = 'refunded'; }
      else if (e) { e.refund = r; e.smdp = 'DELETED'; if (o.qty <= 1) o.status = 'refunded'; }
      o.refund = r;
    } else {
      r.status = 'review';
      if (e) e.refund = r;
      o.refund = r;
      PSA.mail(u.email, 'Заявка на возврат ' + r.no + ' принята', 'Ответим в течение 24 часов');
    }
    save();
    return { ok: true, r: r, instant: ri.instant };
  };
  // Решение по заявке (в рабочей версии — оператор в админке; здесь — демо-панель)
  PSA.decideRefund = function (esimId, decision, note) {
    var d = db(), e = d.esims[esimId]; if (!e || !e.refund) return;
    var r = e.refund, o = d.orders[r.orderId], u = d.users[e.userId];
    r.status = decision; r.decided = now(); r.note = note || '';
    if (decision === 'approved' && u) {
      u.bal += r.amount;
      addOp(u, { t: 'Возврат ' + r.no + ' · одобрен', d: PSA.dt(now()) + ' · на баланс', b: 'main', a: r.amount, kind: 'in' });
      if (o && r.kind === 'topup') { e.n -= o.n; o.status = 'refunded'; delete e.refund; e.lastRefund = r; }
      else { e.smdp = 'DELETED'; if (o) o.status = 'refunded'; }
    }
    save();
  };

  // Сколько заказов на email (чат поддержки находит их по почте)
  PSA.ordersByEmail = function (email) {
    email = normEmail(email);
    return values(db().orders).filter(function (o) { var u = o.userId && db().users[o.userId]; return { paid: 1, refunded: 1 }[o.status] && (normEmail(o.email) === email || (u && u.email === email)); }).length;
  };

  /* ---------- Пополнение баланса ---------- */
  PSA.ops = function () { var u = PSA.user(); return u ? u.ops.slice() : []; };

  /* ---------- Друзья ---------- */
  PSA.friends = function () {
    var d = db(), u = PSA.user(); if (!u) return [];
    return values(d.users).filter(function (x) { return x.invitedBy === u.id; }).sort(function (a, b) { return b.created - a.created; }).map(function (f) {
      var ords = values(d.orders).filter(function (o) { return o.userId === f.id && o.reward && o.reward.to === u.id; });
      var got = ords.filter(function (o) { return o.reward.status === 'paid'; }).reduce(function (s, o) { return s + o.reward.amount; }, 0);
      var pend = ords.filter(function (o) { return o.reward.status === 'pending'; }).reduce(function (s, o) { return s + o.reward.amount; }, 0);
      var last = ords.length ? Math.max.apply(null, ords.map(function (o) { return o.paidAt || o.created; })) : 0;
      return { email: f.email, created: f.created, orders: ords.length, last: last, got: got, pend: pend };
    });
  };
  PSA.refLink = function () {
    var u = PSA.user(); if (!u) return '';
    var base = root.location ? root.location.origin + root.location.pathname.replace(/[^/]*$/, '') : '';
    return base + '?r=' + u.ref;
  };

  /* ---------- Профиль ---------- */
  PSA.setSettings = function (patch) { var u = PSA.user(); if (!u) return; Object.keys(patch).forEach(function (k) { u.set[k] = patch[k]; }); save(); };
  PSA.startEmailChange = function (email) {
    var u = PSA.user(); email = normEmail(email);
    if (!u) return { err: 'auth' };
    if (email === u.email) return { err: 'Это ваш текущий email' };
    if (userByEmail(email)) return { err: 'На этот email уже есть другой кабинет' };
    var r = PSA.requestCode(email, 'change');
    if (r.err) return { err: 'Новый код можно запросить через ' + r.wait + ' с' };
    u.pendingEmail = email; save();
    return { ok: true };
  };
  PSA.confirmEmailChange = function (code) {
    var d = db(), u = PSA.user(); if (!u || !u.pendingEmail) return { err: 'nocode' };
    var r = PSA.checkCode(u.pendingEmail, code);
    if (!r.ok) return r;
    delete d.byEmail[u.email];
    u.email = u.pendingEmail; d.byEmail[u.email] = u.id; delete u.pendingEmail;
    save(); return { ok: true };
  };
  PSA.cancelEmailChange = function () { var u = PSA.user(); if (u) { delete u.pendingEmail; save(); } };
  PSA.deleteAccount = function () {
    var d = db(), u = PSA.user(); if (!u) return;
    // Активные eSIM продолжают работать, но из кабинета пропадают
    values(d.esims).forEach(function (e) { if (e.userId === u.id) e.userId = null; });
    values(d.orders).forEach(function (o) { if (o.userId === u.id) { o.userId = null; o.email = ''; } });
    delete d.byEmail[u.email]; delete d.refs[u.ref]; delete d.users[u.id]; d.sid = null;
    save();
  };

  // Копирование в буфер (кнопки «Копировать»)
  PSA.copy = function (text) {
    try { if (root.navigator.clipboard) return root.navigator.clipboard.writeText(String(text)).catch(function () {}); } catch (e) {}
    try { var t = root.document.createElement('textarea'); t.value = String(text); root.document.body.appendChild(t); t.select(); root.document.execCommand('copy'); t.remove(); } catch (e) {}
  };
  // eSIM для экрана «eSIM готова»: ?id=ESIM или ?o=ЗАКАЗ&k=ТОКЕН (несколько eSIM — по индексу)
  PSA.orderEsims = function () {
    var d = db(), id = PS.qp('id'), oid = PS.qp('o');
    if (id) { var v = PSA.esim(id); return v ? [v] : []; }
    if (oid && PSA.canSeeOrder(oid)) { var o = d.orders[oid]; return (o.esimIds || []).map(function (x) { return d.esims[x] ? esimView(d.esims[x]) : null; }).filter(Boolean); }
    return [];
  };

  /* ---------- QR-код (assets/vendor/qrcode.min.js) ---------- */
  var qrCache = {};
  PSA.qr = function (text) {
    if (!root.PSQR || !text) return { n: 21, cells: [] };
    return qrCache[text] || (qrCache[text] = root.PSQR(text));
  };
  // QR-код картинкой PNG (кнопка «Скачать PNG»)
  PSA.qrPng = function (text) {
    try {
      var q = PSA.qr(text), k = 12, pad = 4, size = (q.n + pad * 2) * k, c = root.document.createElement('canvas');
      c.width = c.height = size; var x = c.getContext('2d');
      x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, size, size); x.fillStyle = '#0E1220';
      q.cells.forEach(function (v, i) { if (v !== 'transparent') x.fillRect((i % q.n + pad) * k, (Math.floor(i / q.n) + pad) * k, k, k); });
      return c.toDataURL('image/png');
    } catch (e) { return ''; }
  };
  // Постер с QR-приглашением в стиле бренда: для печати (кассы, стойки, витрины) и чтобы показать с телефона.
  // 1240×1754 — пропорции A4 (печать A4 / A5 без полей). Возвращает Promise с PNG (data URL)
  PSA.invitePoster = function (link, code) {
    var doc = root.document;
    if (!doc || !root.PSQR || !link) return Promise.resolve('');
    var ready = doc.fonts && doc.fonts.load ? Promise.all(['700 80px Onest', '600 40px Onest', '400 34px Onest', '500 34px "JetBrains Mono"'].map(function (f) { return doc.fonts.load(f).catch(function () {}); })) : Promise.resolve();
    return ready.then(function () {
      var W = 1240, H = 1754, c = doc.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d');
      var rr = function (X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
      var logo = function (X, Y, s) {
        var k = s / 40;
        x.fillStyle = '#2F5BFF'; rr(X, Y, s, s, 12 * k); x.fill();
        x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(X + 13.5 * k, Y + 15.5 * k, 3.2 * k, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#FF7A45'; x.beginPath(); x.arc(X + 26.5 * k, Y + 15.5 * k, 3.2 * k, 0, Math.PI * 2); x.fill();
        x.strokeStyle = '#FFFFFF'; x.lineWidth = 3 * k; x.lineCap = 'round'; x.beginPath(); x.moveTo(X + 11 * k, Y + 23.5 * k); x.bezierCurveTo(X + 13.5 * k, Y + 30.5 * k, X + 26.5 * k, Y + 30.5 * k, X + 29 * k, Y + 23.5 * k); x.stroke();
      };
      // Фон: синий с переходом в фиолетовый, пунктир маршрута с самолётиком
      var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2F5BFF'); g.addColorStop(1, '#5B4CF5');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.save(); x.strokeStyle = 'rgba(255,255,255,.28)'; x.lineWidth = 5; x.setLineDash([18, 22]); x.lineCap = 'round';
      x.beginPath(); x.moveTo(-40, 1180); x.bezierCurveTo(260, 1010, 380, 520, 760, 470); x.bezierCurveTo(1010, 440, 1120, 300, 1300, 150); x.stroke(); x.restore();
      x.save(); x.translate(1080, 300); x.rotate(-0.72); x.fillStyle = '#FFFFFF';
      x.beginPath(); x.moveTo(-34, -9); x.lineTo(26, -3); x.lineTo(40, 0); x.lineTo(26, 3); x.lineTo(-34, 9); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(-6, -3); x.lineTo(-20, -30); x.lineTo(-9, -30); x.lineTo(14, -3); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(-6, 3); x.lineTo(-20, 30); x.lineTo(-9, 30); x.lineTo(14, 3); x.closePath(); x.fill(); x.restore();
      // Логотип
      x.fillStyle = '#FFFFFF'; rr(96, 96, 104, 104, 30); x.fill(); logo(108, 108, 80);
      x.fillStyle = '#FFFFFF'; x.font = '700 64px Onest, sans-serif'; x.textBaseline = 'middle'; x.fillText('Привет', 228, 150);
      var pw = x.measureText('Привет').width;
      x.fillStyle = '#FFFFFF'; rr(228 + pw + 14, 124, 92, 52, 12); x.fill();
      x.fillStyle = '#2F5BFF'; x.font = '500 30px "JetBrains Mono", monospace'; x.textAlign = 'center'; x.fillText('SIM', 228 + pw + 60, 151); x.textAlign = 'left';
      // Заголовок
      x.textBaseline = 'alphabetic'; x.fillStyle = '#FFFFFF'; x.font = '700 92px Onest, sans-serif';
      x.fillText('Интернет в поездке', 96, 360); x.fillText('с первой минуты', 96, 466);
      x.fillStyle = '#E6ECFF'; x.font = '400 38px Onest, sans-serif';
      x.fillText('Наведите камеру телефона на QR-код —', 96, 548);
      x.fillText('и получите 100 ₽ на первую eSIM', 96, 600);
      // Карточка с QR
      var cy = 680, cw = W - 192, ch = 900;
      x.save(); x.shadowColor = 'rgba(14,18,32,.28)'; x.shadowBlur = 60; x.shadowOffsetY = 24; x.fillStyle = '#FFFFFF'; rr(96, cy, cw, ch, 64); x.fill(); x.restore();
      var q = root.PSQR(link, 'H'), n = q.n, size = 640, cell = size / n, qx = (W - size) / 2, qy = cy + 64;
      x.fillStyle = '#0E1220';
      q.cells.forEach(function (v, i) { if (v !== 'transparent') { var cx2 = i % n, cy2 = Math.floor(i / n); x.fillRect(Math.floor(qx + cx2 * cell), Math.floor(qy + cy2 * cell), Math.ceil(cell), Math.ceil(cell)); } });
      // Логотип в центре QR (уровень коррекции H выдерживает)
      x.fillStyle = '#FFFFFF'; rr(W / 2 - 74, qy + size / 2 - 74, 148, 148, 36); x.fill(); logo(W / 2 - 60, qy + size / 2 - 60, 120);
      x.textAlign = 'center'; x.fillStyle = '#0E1220'; x.font = '600 44px Onest, sans-serif';
      x.fillText(link.replace(/^https?:\/\//, '').replace(/\/\?/, '/?'), W / 2, qy + size + 86);
      if (code) {
        x.font = '500 34px "JetBrains Mono", monospace'; var t = 'КОД ДРУГА  ' + code, tw = x.measureText(t).width + 56;
        x.fillStyle = '#F2F5FF'; rr((W - tw) / 2, qy + size + 120, tw, 64, 32); x.fill();
        x.fillStyle = '#1F45D6'; x.fillText(t, W / 2, qy + size + 164);
      }
      // Низ
      x.fillStyle = '#FFFFFF'; x.font = '600 40px Onest, sans-serif';
      x.fillText('eSIM для путешествий в 190+ стран', W / 2, 1666);
      x.fillStyle = '#E6ECFF'; x.font = '400 32px Onest, sans-serif';
      x.fillText('Без роуминга и пластика · установка за 2 минуты · privetsim.net', W / 2, 1714);
      return c.toDataURL('image/png');
    }).catch(function () { return ''; });
  };
  // Распечатать картинку (постер с QR) — отдельное окно с одной страницей
  PSA.printImage = function (src, title) {
    var w = root.open('', '_blank');
    if (!w) return;
    w.document.write('<!doctype html><title>' + (title || 'Печать') + '</title><style>@page{size:A4;margin:0}html,body{margin:0;height:100%}img{display:block;width:100%;height:100%;object-fit:contain}</style><img src="' + src + '" onload="setTimeout(function(){print()},200)">');
    w.document.close();
  };
  // Демо-адреса кошельков для USDT по сетям
  PSA.NETS = [
    { id: 'TRON', name: 'TRON', std: 'TRC-20', addr: 'TQ7hXk2mP9vR4sLw8NcY3bJ6tF1eGz5Ad0', memo: false },
    { id: 'TON', name: 'TON', std: 'TON', addr: 'UQB7mN4kQ2vX9pLr8Ts1Hc6Zw3Ey5Ja0Gd7Fu2Ko4Ib', memo: true },
    { id: 'BEP-20', name: 'BEP-20', std: 'BEP-20', addr: '0x4f2A9c81E7b03D5e6F1a28C4d97B0e3A5c6D8f1B', memo: false }
  ];

  /* ================= Значения для всех экранов ================= */
  var valsOld = PS.vals;
  PS.vals = function () {
    var v = valsOld ? valsOld() : {};
    var u = PSA.user(), b = PSA.balance(), m = u ? PSA.mainEsim() : null;
    v.psAuthed = !!u; v.psGuest = !u;
    v.psEmail = u ? u.email : '';
    v.psAva = u ? u.email.charAt(0).toUpperCase() : '';
    v.psAvaAria = u ? 'Профиль ' + u.email : 'Профиль';
    v.psBal = PSA.rub(b.total);
    v.psChip = !!m; v.psNoChip = !m;
    v.psChipFlag = m ? m.flag : '';
    v.psChipText = m ? (m.activatedAt ? PSA.gb(m.left) + ' · ' + m.daysLeft + NB + 'дн' : m.stText) : '';
    v.psChipW = m ? (m.activatedAt ? m.pc : 100) + '%' : '0%';
    v.psChipAria = m ? 'eSIM ' + m.name + ': ' + m.stText.toLowerCase() + (m.activatedAt ? ', осталось ' + PSA.gb(m.left) + ' из ' + PSA.gb(m.total) : '') : '';
    v.psChipHref = m ? m.href : 'account.html';
    v.psSeller = (PS.sellerLine && PS.sellerLine().replace(/^ · /, '')) || 'Привет SIM';
    return v;
  };

  /* ================= Уведомления (демо-письма) ================= */
  PSA.notice = function (title, subject, text, plain) {
    var doc = root.document; if (!doc || !doc.body) return;
    var box = doc.getElementById('psa-notes');
    if (!box) { box = doc.createElement('div'); box.id = 'psa-notes'; box.setAttribute('aria-live', 'polite'); doc.body.appendChild(box); }
    var n = doc.createElement('div'); n.className = 'psa-note';
    n.innerHTML = '<span class="psa-note-i" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6 8.5-6"/></svg></span><span class="psa-note-t"><small></small><b></b><span></span></span><button type="button" aria-label="Закрыть">×</button>';
    n.querySelector('small').textContent = plain ? title : 'Демо · ' + title;
    n.querySelector('b').textContent = subject;
    n.querySelector('.psa-note-t span').textContent = text || '';
    n.querySelector('button').onclick = function () { n.remove(); };
    box.appendChild(n);
    setTimeout(function () { n.classList.add('out'); setTimeout(function () { n.remove(); }, 400); }, 9000);
  };

  /* ================= Демо-панель ================= */
  // Только в демо-режиме: переключает статусы eSIM, оплату и время — чтобы проверить все экраны
  PSA.demo = {
    esim: function (id, act) {
      var d = db(), e = d.esims[id]; if (!e) return;
      var t = now();
      if (act === 'install') { e.installedAt = t; e.smdp = 'ENABLED'; }
      if (act === 'connect') { if (!e.installedAt) e.installedAt = t - 3600e3; e.activatedAt = t - 2 * 3600e3; e.expiresAt = e.activatedAt + e.d * DAY; e.smdp = 'ENABLED'; }
      if (act === 'use1') { if (!e.activatedAt) PSA.demo.esim(id, 'connect'); e.extraUsed = (e.extraUsed || 0) + 1; }
      if (act === 'useAll') { if (!e.activatedAt) PSA.demo.esim(id, 'connect'); e.extraUsed = (e.extraUsed || 0) + e.n; }
      if (act === 'fail') { e.installedAt = 0; e.smdp = 'DOWNLOAD'; }
      if (act === 'disable') e.smdp = e.smdp === 'DISABLED' ? 'ENABLED' : 'DISABLED';
      if (act === 'delete') e.smdp = 'DELETED';
      if (act === 'expire') { if (!e.activatedAt) PSA.demo.esim(id, 'connect'); e.expiresAt = t - 60e3; }
      if (act === 'burn') { e.installedAt = 0; e.installBy = t - 60e3; e.smdp = 'RELEASED'; }
      if (act === 'block') e.blocked = !e.blocked;
      if (act === 'reset') { e.installedAt = 0; e.activatedAt = 0; e.expiresAt = 0; e.extraUsed = 0; e.smdp = 'RELEASED'; e.blocked = false; e.installBy = t + 180 * DAY; }
      save(); PSA.settle();
    },
    shift: function (days) { db().shift = (db().shift || 0) + days * DAY; save(); PSA.settle(); },
    credit: function (rub) { var u = PSA.user(); if (!u) return; u.bal += rub; addOp(u, { t: 'Пополнение · демо', d: PSA.dt(now()), b: 'main', a: rub, kind: 'in' }); save(); },
    // Друг регистрируется по вашей ссылке и покупает eSIM (видно в «Позвать друзей» и в балансе)
    friend: function () {
      var me = PSA.user(); if (!me) return;
      var d = db(), mail = 'friend' + digits(3) + '@mail.ru', f = newUser(mail);
      f.invitedBy = me.id; f.created = now();
      var keep = d.sid; d.sid = f.id;
      var o = PSA.createOrder({ kind: 'esim', code: 'TR', pkg: (PS.plans('TR').total.filter(function (p) { return p.n === 5; })[0] || PS.plans('TR').total[0]).code, method: 'sbp', email: mail });
      PSA.confirmPayment(o.id);
      d.sid = keep; save();
    },
    pay: function (id, how) {
      var o = db().orders[id]; if (!o) return;
      if (how === 'ok') PSA.confirmPayment(id);
      if (how === 'fail') PSA.failPayment(id);
      if (how === 'expire') { o.payBy = now() - 1000; save(); PSA.orderStatus(o); }
      if (how === 'part') { o.usdtGot = Math.round((o.usdt - 1.0427) * 10000) / 10000; o.payBy = now() + 30 * MIN; o.hold = true; save(); }
      if (how === 'late') { o.status = 'expired'; save(); PSA.confirmPayment(id); }
    },
    refund: function (id, how) { PSA.decideRefund(id, how); },
    reset: function () { try { root.localStorage.removeItem(KEY); } catch (e) {} mem = null; root.location.href = 'index.html'; }
  };
  function demoPanel() {
    var doc = root.document; if (!PSA.DEMO || !doc.body || doc.getElementById('psa-demo')) return;
    var page = (root.location.pathname.split('/').pop() || 'index.html');
    var box = doc.createElement('div'); box.id = 'psa-demo';
    box.innerHTML = '<button type="button" aria-expanded="false">ДЕМО</button><div class="psa-dp" hidden></div>';
    doc.body.appendChild(box);
    var btn = box.firstChild, dp = box.lastChild;
    var group = function (title, items) {
      var g = doc.createElement('div'); g.className = 'psa-g';
      g.innerHTML = '<span></span><div class="psa-row"></div>'; g.firstChild.textContent = title;
      items.forEach(function (it) { var b = doc.createElement('button'); b.type = 'button'; b.textContent = it[0]; if (it[2]) b.className = 'warn'; b.onclick = function () { it[1](); render(); }; g.lastChild.appendChild(b); });
      dp.appendChild(g);
    };
    function render() {
      dp.innerHTML = '<div><b>Демо-режим</b><small>Сервер ещё не подключён: данные хранятся в этом браузере, письма показываются уведомлением, оплата имитируется.</small></div>';
      var id = PS.qp('id'), oid = PS.qp('o');
      if (page === 'esim.html' && db().esims[id]) {
        var E = esimView(db().esims[id]), A = function (a) { return function () { PSA.demo.esim(id, a); }; };
        group('eSIM · ' + E.stText, [['Установлена', A('install')], ['В сети', A('connect')], ['−1 ГБ', A('use1')], ['Трафик весь', A('useAll')], ['Ошибка установки', A('fail')], ['Выкл/вкл в телефоне', A('disable')], ['Удалена', A('delete'), 1], ['Срок истёк', A('expire'), 1], ['Сгорела', A('burn'), 1], ['Блок', A('block'), 1], ['Сначала', A('reset')]]);
        var rq = db().esims[id].refund;
        if (rq && rq.status !== 'approved') group('Заявка ' + rq.no, [['Одобрить', function () { PSA.demo.refund(id, 'approved'); }], ['Нужны подробности', function () { PSA.demo.refund(id, 'info'); }], ['Отклонить', function () { PSA.demo.refund(id, 'rejected'); }, 1]]);
      }
      if (page === 'payment.html' && oid && db().orders[oid] && db().orders[oid].status === 'pending') {
        var P = function (h) { return function () { PSA.demo.pay(oid, h); }; };
        group('Оплата ' + db().orders[oid].no, [['Оплата прошла', P('ok')], ['Банк отклонил', P('fail'), 1], ['Время вышло', P('expire'), 1]].concat(db().orders[oid].method === 'usdt' ? [['Пришло меньше', P('part')]] : []));
      }
      if (PSA.authed()) group('Кабинет', [['+1 000 ₽ на баланс', function () { PSA.demo.credit(1000); }], ['Друг купил по ссылке', PSA.demo.friend]]);
      group('Время · ' + (db().shift ? '+' + Math.round(db().shift / DAY) + ' дн.' : 'сейчас'), [['+1 день', function () { PSA.demo.shift(1); }], ['+7 дней', function () { PSA.demo.shift(7); }], ['+30 дней', function () { PSA.demo.shift(30); }], ['+6 мес.', function () { PSA.demo.shift(182); }], ['Вернуть', function () { db().shift = 0; save(); }]]);
      group('Данные', [['Стереть всё', PSA.demo.reset, 1]]);
    }
    btn.onclick = function () { var open = dp.hidden; dp.hidden = !open; btn.setAttribute('aria-expanded', String(open)); if (open) render(); };
    PSA.sub(function () { if (!dp.hidden) render(); });
  }
  if (root.document) { if (root.document.readyState === 'loading') root.addEventListener('DOMContentLoaded', demoPanel); else setTimeout(demoPanel, 0); }

  if (!PSA.DEMO) { apiDriver(); return; }
  // Выход по ссылке login.html?logout=1
  if (PS.qp && PS.qp('logout')) { PSA.logout(); }
  PSA.settle();

  /* ================= API-драйвер (SITE_CONFIG.demo = false) ================= */
  function apiDriver() {
    var GB = 1073741824, POLL = 3000;
    var r2 = function (x) { return Math.round(x * 100) / 100; };
    var tms = function (x) { return x ? new Date(x).getTime() : 0; };
    var me = function () { return PSA.user(); };

    // Запрос к API. Не бросает: ошибка сети → { error: 'network' }
    function call(method, path, body) {
      var opt = { method: method, credentials: 'include', headers: {} };
      if (method !== 'GET') { opt.headers['content-type'] = 'application/json'; opt.body = JSON.stringify(body || {}); }
      return root.fetch(API + path, opt).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (j) { if (!res.ok && !j.error) j.error = 'http_' + res.status; return j; });
      }).catch(function () { return { error: 'network', message: 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз' }; });
    }
    function fail(r, fallback) {
      var text = (r && r.message && r.message !== r.error ? r.message : '') || fallback || 'Что-то пошло не так. Попробуйте ещё раз';
      PSA.notice('Ошибка', text, '', true);
      return { err: r && r.error || 'fail', text: text };
    }

    /* ---------- Каталог: тариф по коду пакета ---------- */
    var byPkg = null;
    function planByPkg(pkg) {
      if (!byPkg) {
        byPkg = {};
        var C = root.PS_CATALOG || {};
        [C.countries || {}, C.regions || {}].forEach(function (group) {
          Object.keys(group).forEach(function (code) {
            var pl; try { pl = PS.plans(code); } catch (e) { return; }
            (pl.total || []).forEach(function (p) { if (p.code && !byPkg[p.code]) byPkg[p.code] = { code: code, t: 'total', p: p }; });
            (pl.daily || []).forEach(function (p) { if (p.code && !byPkg[p.code]) byPkg[p.code] = { code: code, t: 'daily', p: p }; });
          });
        });
      }
      return byPkg[pkg] || null;
    }
    // Код направления сайта по ответу сервера: страна (TR) или группа поставщика (EU-42)
    function destCode(dest) {
      var C = root.PS_CATALOG || {};
      if (!dest) return 'TR';
      if ((C.countries || {})[dest]) return dest;
      var reg = Object.keys(C.regions || {}).filter(function (k) { return C.regions[k].group === dest || k === dest; })[0];
      return reg || 'TR';
    }

    /* ---------- Ответ сервера → структуры демо-режима (экраны читают их синхронно) ---------- */
    var SRV = { pending_payment: 'pending', paid: 'paid', provisioning: 'paid', completed: 'paid', expired: 'expired', refunded: 'refunded', late: 'late' };
    function orderFrom(x, uid) {
      var kind = x.kind === 'new' ? 'esim' : x.kind, bal = (x.balanceKopecks || 0) / 100, toPay = (x.amountKopecks || 0) / 100;
      var o = { id: x.id, token: x.token || '', no: 'T-' + String(x.number || 0).padStart(4, '0'), created: tms(x.createdAt), srv: x.status,
        status: x.status === 'failed' ? (x.paidAt ? 'paid' : 'failed') : (SRV[x.status] || 'pending'), kind: kind, method: x.method || 'sbp',
        qty: x.quantity || 1, email: x.email || '', userId: uid || null, sum: bal + toPay, fromBal: bal, toPay: toPay, disc: 0, promo: '',
        payBy: tms(x.createdAt) + 60 * MIN, paidAt: tms(x.paidAt), paymentUrl: x.paymentUrl || '', esimIds: [], esimId: x.topupEsimId || null,
        usdt: 0, net: '', preparing: x.status === 'paid' || x.status === 'provisioning' || (x.status === 'failed' && !!x.paidAt) };
      if (kind === 'balance') { o.label = 'Пополнение баланса'; return o; }
      var f = planByPkg(x.packageCode);
      o.pkg = x.packageCode; o.code = f ? f.code : destCode(x.dest); o.t = f ? f.t : 'total';
      o.d = x.periodDays || x.durationDays || (f && parseInt(f.p.daysShort, 10)) || 0;
      // Объём из каталога сайта (500 МБ = 0,5 ГБ); байты поставщика — если тарифа на сайте нет
      o.n = f ? (f.t === 'daily' ? f.p.n * o.d : f.p.n) : (x.volumeBytes ? r2(x.volumeBytes / GB) : 0);
      o.top = f ? f.p.top : 1; o.unit = o.sum / o.qty; o.gbLabel = o.t === 'daily' && f ? f.p.gb : PSA.gb(o.n);
      labels(o);
      return o;
    }
    function labels(o) {
      o.name = info(o.code).name;
      o.label = o.kind === 'topup' ? 'Пополнение ' + o.name + ' · +' + PSA.gb(o.n) : o.name + ' · ' + o.gbLabel + ' · ' + PSA.days(o.d);
    }
    function esimFrom(x, o, idx) {
      var es = x.esimStatus || 'GOT_RESOURCE', sm = x.smdpStatus || 'RELEASED', on = /^(IN_USE|USED_UP|USED_EXPIRED)$/.test(es);
      var exp = tms(x.expiredTime), created = tms(x.createdAt), upd = tms(x.updatedAt) || created, d = x.totalDuration || o.d || 0;
      var total = x.totalVolume ? r2(x.totalVolume / GB) : o.n;
      if (o.n && Math.abs(total - o.n) < o.n * 0.05) total = o.n; // 524 288 000 байт → ровно «500 МБ», как в тарифе
      var part = String(x.ac || '').split('$'), t = now();
      var e = { id: x.id, orderId: o.id, userId: o.userId, code: o.code, pkg: o.pkg, n: total, n0: o.n || total, d: d, t: o.t, top: o.top,
        iccid: x.iccid || '', ac: x.ac || '', act: part[2] || '', smdpAddr: part[1] || '', created: created,
        installBy: !on && exp ? exp : created + 180 * DAY, smdp: sm, installedAt: 0, activatedAt: 0, expiresAt: 0,
        used: es === 'USED_UP' ? total : (x.orderUsage || 0) / GB, real: true, extraUsed: 0, topups: [], sentTo: x.sentTo || '', idx: idx,
        blocked: /^(REVOKE|REVOKED|SUSPENDED)$/.test(es) };
      if (on) { e.activatedAt = exp ? exp - d * DAY : upd; e.expiresAt = exp || upd + d * DAY; e.installedAt = Math.min(upd, e.activatedAt); }
      else if (/^(INSTALLATION|ENABLED|DISABLED)$/.test(sm)) e.installedAt = upd;
      if (es === 'CANCEL') e.smdp = 'DELETED';
      if (es === 'UNUSED_EXPIRED') { e.installedAt = 0; e.installBy = Math.min(e.installBy, t - 1000); }
      if (es === 'USED_EXPIRED') e.expiresAt = Math.min(e.expiresAt, t - 1000);
      return e;
    }
    function putOrder(d, x, uid) {
      var o = orderFrom(x, uid), old = d.orders[o.id];
      if (old) { o.refund = old.refund; if (!o.token) o.token = old.token; }
      d.orders[o.id] = o;
      (x.esims || []).forEach(function (ex, i) {
        var e = esimFrom(ex, o, i), prev = d.esims[e.id];
        if (prev) { e.refund = prev.refund; e.lastRefund = prev.lastRefund; }
        d.esims[e.id] = e; o.esimIds.push(e.id);
      });
      return o;
    }
    // Пополнения: направление — от eSIM, к которой они куплены
    function link(d) {
      values(d.orders).forEach(function (o) {
        if (o.kind !== 'topup') return;
        var e = d.esims[o.esimId]; if (!e) return;
        o.code = e.code; labels(o);
        if (o.status === 'paid' && e.topups.indexOf(o.id) < 0) e.topups.push(o.id);
      });
    }
    function setDefaults(set) {
      var def = { lang: 'ru', mlang: 'ru', cur: 'rub', nt: { low: [1, 1], exp: [1, 1], act: [0, 1], top: [1, 1], pay: [1, 1], inst: [1, 1], promo: [0, 0], dest: [0, 1], ref: [1, 1] }, expAt: 1, quiet: true, auto: false, balFirst: false };
      var s2 = Object.assign({}, def, set || {});
      s2.nt = Object.assign({}, def.nt, (set || {}).nt || {});
      return s2;
    }
    function ingest(st) {
      var keep = mem || blank(), d = blank();
      // Гостевые заказы (открыты по ссылке ?o=&k=) сохраняем
      values(keep.orders).forEach(function (o) { if (!o.userId) { d.orders[o.id] = o; o.esimIds.forEach(function (id) { if (keep.esims[id]) d.esims[id] = keep.esims[id]; }); } });
      d.friends = [];
      if (st && st.user) {
        var U = st.user;
        var u = { id: U.id, email: U.email || '', created: tms(U.createdAt), ref: U.ref, invitedBy: U.invited ? 'friend' : null,
          bal: st.balance.ownKopecks / 100, bonus: st.balance.bonusKopecks / 100, emails: [], verified: true, pendingEmail: U.pendingEmail || undefined,
          set: setDefaults(U.settings), ops: st.ops.map(function (x) {
            return { id: x.id, ts: tms(x.createdAt), t: x.title, d: PSA.dt(tms(x.createdAt)) + (x.note ? ' · ' + x.note : ''), b: x.bucket, a: x.amountKopecks / 100, kind: x.kind, pend: x.pending, cancel: x.cancelled, orderId: x.orderId };
          }) };
        u.set.tg = !!U.telegram; u.set.g = !!U.google; u.tgName = U.telegramUsername || '';
        d.users[u.id] = u; d.byEmail[u.email] = u.id; d.refs[u.ref] = u.id; d.sid = u.id;
        st.orders.forEach(function (x) { putOrder(d, x, u.id); });
        // Возвраты: к заказу и eSIM (как в демо)
        st.refunds.slice().reverse().forEach(function (x) {
          var o = d.orders[x.orderId]; if (!o) return;
          var r = { id: x.id, no: x.no, reason: x.reason, text: x.text || '', ts: tms(x.createdAt), amount: x.amountKopecks / 100, orderId: x.orderId, kind: o.kind, status: x.status, decided: tms(x.decidedAt), instant: x.instant, note: x.note || '' };
          o.refund = r;
          var e = d.esims[x.esimId || ''] || (o.kind === 'topup' ? d.esims[o.esimId] : null);
          if (!e) return;
          if (o.kind === 'topup' && x.status === 'approved') e.lastRefund = r; else e.refund = r;
        });
        d.friends = st.friends.map(function (f) { return { email: f.email, created: tms(f.createdAt), orders: f.orders, last: tms(f.last), got: f.gotKopecks / 100, pend: f.pendKopecks / 100 }; });
      }
      link(d);
      mem = d;
    }
    // Последнее состояние кабинета — чтобы шапка (аватар, баланс) была видна сразу, до ответа сервера
    var CACHE = 'ps.st.v1';
    function cache(st) { try { if (st && st.user) root.localStorage.setItem(CACHE, JSON.stringify(st)); else root.localStorage.removeItem(CACHE); } catch (e) {} }
    function load() {
      return call('GET', '/account/state').then(function (st) {
        if (st.error === 'network') { fail(st); return; }
        ingest(st.error ? null : st); cache(st.error ? null : st); save();
        // Вход через Telegram / Google: код друга из ссылки ?r= отправляем после входа
        var ref = st.user && PSA.pendingRef();
        if (ref) {
          try { root.localStorage.removeItem('ps.ref'); } catch (e) {}
          if (!st.user.invited) return call('POST', '/account/referral', { code: ref }).then(function (r) { if (r.invited) return load(); });
        }
      });
    }
    try { var cached = JSON.parse(root.localStorage.getItem(CACHE) || 'null'); if (cached && cached.user && !PS.qp('logout')) ingest(cached); } catch (e) {}
    // Один заказ по ссылке (гость: ?o=&k=) или для слежения за оплатой и выдачей
    function fetchOrder(id, token) {
      return call('GET', '/orders/' + encodeURIComponent(id) + (token ? '?t=' + encodeURIComponent(token) : '')).then(function (r) {
        if (!r.order) return null;
        var d = db(), old = d.orders[id], u = me();
        var o = putOrder(d, r.order, old ? old.userId : null);
        if (!o.token) o.token = token || '';
        if (!old && u && token) { /* новый заказ этого пользователя — подтянем в кабинет при следующей загрузке */ }
        link(d);
        return o;
      });
    }
    // Слежение за заказом: оплата (страница payment.html) и выдача eSIM (order.html)
    var watching = {};
    function watch(o) {
      if (!o || watching[o.id]) return;
      var live = function (x) { return x && (x.srv === 'pending_payment' || x.srv === 'paid' || x.srv === 'provisioning'); };
      if (!live(o)) return;
      watching[o.id] = setInterval(function () {
        var cur = db().orders[o.id], before = JSON.stringify(cur);
        fetchOrder(o.id, cur && cur.token).then(function (x) {
          if (!x) return;
          if (!live(x)) { clearInterval(watching[o.id]); if (me()) return load(); }
          if (JSON.stringify(db().orders[o.id]) !== before) save();
        });
      }, POLL);
    }

    /* ---------- Вход по коду из письма ---------- */
    var SENT = 'ps.codes';
    var sent = function () { try { return JSON.parse(root.sessionStorage.getItem(SENT) || '{}'); } catch (e) { return {}; } };
    var markSent = function (email, ts) { var m = sent(); m[email] = ts; try { root.sessionStorage.setItem(SENT, JSON.stringify(m)); } catch (e) {} };
    PSA.codeWait = function (email) { var t = sent()[normEmail(email)]; return t ? Math.max(0, Math.ceil((t + PSA.RESEND * 1000 - Date.now()) / 1000)) : 0; };
    PSA.demoCode = function () { return ''; };
    PSA.requestCode = function (email) {
      email = normEmail(email);
      return call('POST', '/auth/email/request', { email: email }).then(function (r) {
        if (r.ok) { markSent(email, Date.now()); return { ok: true, wait: PSA.RESEND }; }
        if (r.error === 'code_wait') { markSent(email, Date.now() - (PSA.RESEND - r.wait) * 1000); return { err: 'wait', wait: r.wait }; }
        if (r.error === 'code_hour') return { err: 'hour', wait: r.wait };
        return { err: 'fail', wait: 0, text: r.error === 'network' ? r.message : (r.error === 'validation_error' ? 'Похоже, в адресе ошибка' : 'Не удалось отправить код. Попробуйте ещё раз') };
      });
    };
    var CODE_ERR = function (r) {
      if (r.error === 'code_invalid') return { err: 'invalid', left: r.left };
      if (r.error === 'code_expired') return { err: 'expired' };
      if (r.error === 'code_locked' || r.error === 'code_missing') return { err: 'locked' };
      return { err: 'fail', text: r.error === 'network' ? r.message : (r.message && r.message !== r.error ? r.message : 'Не получилось. Попробуйте ещё раз') };
    };
    PSA.verifyLogin = function (email, code, ref) {
      return call('POST', '/auth/email/verify', { email: normEmail(email), code: String(code), ref: ref || undefined }).then(function (r) {
        if (!r.user) return CODE_ERR(r);
        try { root.localStorage.removeItem('ps.ref'); } catch (e) {}
        gPending = '';
        return load().then(function () { return { ok: true, isNew: !!r.isNew, invited: !!r.invited, linked: r.linked }; });
      });
    };
    // Код друга: проверяем формат сразу, наличие — на сервере (неизвестный код сервер просто не применит)
    var refs = {};
    PSA.refValid = function (code) {
      var c = up(code);
      if (!/^PRIVET-[A-Z0-9]{4}$/.test(c)) return false;
      if (!(c in refs)) { refs[c] = true; call('GET', '/referral/' + encodeURIComponent(c)).then(function (r) { if (r.ok === false) { refs[c] = false; save(); } }); }
      return refs[c];
    };
    PSA.hasAccount = function () { return false; };
    PSA.logout = function () {
      mem = blank(); save(); cache(null);
      try { root.localStorage.removeItem('ps.chat.v2'); } catch (e) {}
      return call('POST', '/auth/logout', {});
    };

    /* ---------- Вход и привязка: Telegram (через бота) и Google ---------- */
    var prov = { google: false, telegram: false }, gPending = '';
    PSA.providers = function () { return prov; };
    PSA.googlePending = function () { return gPending; };
    PSA.googleUrl = function (next, link) { return API + '/auth/google/start?' + (link ? 'link=1&' : '') + 'next=' + encodeURIComponent(next || 'account.html'); };
    // Сайт создаёт вход, бот спрашивает «Это я?», сайт ждёт подтверждения. link — привязать к кабинету (профиль)
    // cb получает { status: 'start' | 'wait' | 'ok' | 'fail', code, url, opened, text }
    var tgs = null, tgTimer = 0;
    PSA.tgCancel = function () { clearInterval(tgTimer); tgs = null; };
    PSA.tgStart = function (link, cb) {
      PSA.tgCancel();
      var w = null;
      try { w = root.open('about:blank', '_blank'); } catch (e) {} // окно открываем сразу по клику, иначе браузер заблокирует
      var st = tgs = { status: 'start' };
      var emit = function () { if (tgs === st) cb(st); };
      var close = function () { try { if (w) w.close(); } catch (e) {} };
      emit();
      call('POST', '/auth/telegram/start', {}).then(function (r) {
        if (tgs !== st) return close();
        if (!r.secret) { close(); st.status = 'fail'; st.text = r.error === 'network' ? r.message : ''; return emit(); }
        st.status = 'wait'; st.code = r.verifyCode; st.url = r.url; st.opened = false;
        try { if (w) { w.location.href = r.url; st.opened = true; } } catch (e) {}
        emit();
        var started = Date.now(), busy = false;
        tgTimer = setInterval(function () {
          if (busy || tgs !== st) return;
          if (Date.now() - started > 10 * MIN) { clearInterval(tgTimer); st.status = 'fail'; st.text = ''; return emit(); }
          busy = true;
          call('POST', '/auth/telegram/poll', { secret: r.secret, link: !!link }).then(function (p) {
            busy = false;
            if (tgs !== st || p.status === 'pending' || p.error === 'network') return;
            clearInterval(tgTimer);
            if (p.status === 'confirmed') return load().then(function () { st.status = 'ok'; emit(); });
            st.status = 'fail'; st.text = p.message && p.message !== p.error ? p.message : ''; emit();
          });
        }, 2000);
      });
    };
    PSA.unlink = function (provider) {
      return call('POST', '/account/unlink', { provider: provider }).then(function (r) {
        if (!r.ok) return fail(r, 'Не получилось отвязать. Попробуйте ещё раз');
        return load().then(function () { return { ok: true }; });
      });
    };
    // Mini App: Telegram передаёт подписанные данные пользователя — входим без кнопок
    function miniApp() {
      var init = '';
      try { init = (root.Telegram && root.Telegram.WebApp && root.Telegram.WebApp.initData) || new URLSearchParams(String(root.location.hash || '').slice(1)).get('tgWebAppData') || ''; } catch (e) {}
      if (!init || PS.qp('logout')) return;
      var mark = init.slice(-24);
      try { if (root.sessionStorage.getItem('ps.tgma') === mark) return; } catch (e) {}
      return call('POST', '/auth/telegram/miniapp', { initData: init }).then(function (r) {
        if (r.user) try { root.sessionStorage.setItem('ps.tgma', mark); } catch (e) {}
      });
    }
    function authExtras() {
      return Promise.all([
        call('GET', '/auth/providers').then(function (r) { if (!r.error) prov = { google: !!r.google, telegram: !!r.telegram }; }),
        PS.qp('merge') === 'google' ? call('GET', '/auth/google/pending').then(function (r) { gPending = r.email || ''; }) : null
      ]);
    }

    /* ---------- Заказы и оплата ---------- */
    PSA.checkPromo = function () { return { err: 'Такого промокода нет. Проверьте буквы и цифры' }; };
    PSA.createOrder = function (p) {
      var u = me(), body = { source: 'web', returnTo: 'site', method: p.method === 'usdt' ? 'usdt' : (p.method === 'balance' ? 'balance' : 'sbp') };
      if (p.kind === 'balance') { body.balanceRub = Math.round(p.amount); if (body.method === 'balance') body.method = 'sbp'; }
      else {
        body.packageCode = p.pkg;
        if (p.kind === 'topup') body.topupEsimId = p.esimId;
        else {
          body.quantity = Math.min(10, Math.max(1, p.qty || 1));
          var f = PS.findPlan(up(p.code), p.pkg);
          if (f && f.t === 'daily') body.days = Math.min(90, Math.max(1, parseInt(p.d, 10) || 10));
        }
        if (p.email) body.email = normEmail(p.email);
        if (u && p.useBal) body.useBalanceKopecks = Math.round(p.useBal * 100);
      }
      return call('POST', '/orders', body).then(function (r) {
        if (!r.id) return fail(r, r.error === 'balance_low' ? r.message : 'Не удалось создать заказ. Попробуйте ещё раз');
        return fetchOrder(r.id, r.token).then(function (o) {
          if (!o) return fail({}, 'Заказ создан, но не загрузился. Обновите страницу');
          if (u) o.userId = u.id;
          o.token = r.token; o.paymentUrl = r.paymentUrl || o.paymentUrl;
          if (u) load(); // баланс и операции после списания
          return o;
        });
      });
    };
    PSA.payUrl = function (o) { return o.paymentUrl || 'payment.html?o=' + o.id + '&k=' + o.token; };
    PSA.orderStatus = function (o) {
      watch(o);
      return o.status === 'pending' && now() > o.payBy ? 'expired' : o.status;
    };
    PSA.confirmPayment = function (id) { var o = db().orders[id]; if (o) fetchOrder(id, o.token).then(function () { save(); }); return o; };
    PSA.failPayment = PSA.cancelOrder = function (id) { return db().orders[id]; };
    PSA.settle = function () {};
    var orderEsims0 = PSA.orderEsims;
    // Оплачено, eSIM ещё выдаётся: показываем «Готовим eSIM…» и ждём
    PSA.orderEsims = function () {
      var l = orderEsims0(); if (l.length) return l;
      var oid = PS.qp('o'), o = oid && PSA.order(oid);
      if (!o || o.kind !== 'esim' || !o.preparing) return [];
      watch(o);
      var v = esimView({ id: 'stub', orderId: o.id, code: o.code, n: o.n, n0: o.n, d: o.d, t: o.t, iccid: '0000000000000000000', act: '', ac: '', smdpAddr: '', created: now(), installBy: now() + 180 * DAY, smdp: 'RELEASED', topups: [] });
      v.preparing = true;
      return [v];
    };
    PSA.ordersByEmail = function (email) { var u = me(); return u && u.email === normEmail(email) ? PSA.orders().length : 0; };

    /* ---------- Пополнение eSIM: пакеты поставщика для этой eSIM ---------- */
    var tops = {}, topsLoading = {};
    PSA.topupPlans = function (esimId) {
      if (tops[esimId]) return tops[esimId];
      if (!topsLoading[esimId] && esimId && esimId !== 'stub') {
        topsLoading[esimId] = 1;
        call('GET', '/account/esims/' + encodeURIComponent(esimId) + '/topups').then(function (r) {
          tops[esimId] = (r.topups || []).map(function (p) { var n = r2(p.volume / GB); return { code: p.code, n: n, gb: PSA.gb(n), daysShort: p.duration + ' ДН', price: Math.round(p.priceKopecks / 100), top: 1 }; });
          save();
        });
      }
      return [];
    };
    PSA.sendToFriend = function (esimId, email, msg) {
      var e = db().esims[esimId]; if (!e) return { err: 'nf' };
      e.sentTo = normEmail(email); save();
      return call('POST', '/account/esims/' + encodeURIComponent(esimId) + '/send', { email: normEmail(email), message: msg || undefined }).then(function (r) {
        if (r.ok) return { ok: true };
        e.sentTo = ''; save();
        return fail(r, r.error === 'already_sent' ? 'Эту eSIM уже отправили' : (r.error === 'esim_installed' ? 'eSIM уже установлена — отправить её нельзя' : ''));
      });
    };

    /* ---------- Возврат ---------- */
    var refundInfo0 = PSA.refundInfo;
    PSA.refundInfo = function (orderId) {
      var ri = refundInfo0(orderId);
      // Пополнение: проверить, что гигабайты не тронуты, может только поддержка — всегда заявка
      if (ri && ri.order.kind === 'topup') { ri.instant = false; ri.used = true; }
      return ri;
    };
    PSA.refund = function (orderId, reason, text) {
      return call('POST', '/account/refunds', { orderId: orderId, reason: reason, text: text || undefined }).then(function (r) {
        if (!r.refund) return fail(r, r.error === 'refund_exists' ? 'Заявка по этому заказу уже есть' : 'Не удалось оформить возврат. Напишите в поддержку');
        return load().then(function () {
          var o = db().orders[orderId];
          return { ok: true, instant: !!r.instant, r: (o && o.refund) || { no: r.refund.no, amount: r.refund.amountKopecks / 100 } };
        });
      });
    };

    /* ---------- Друзья, профиль ---------- */
    PSA.friends = function () { return me() ? (db().friends || []).slice() : []; };
    var SETS = { lang: 1, mlang: 1, cur: 1, nt: 1, expAt: 1, quiet: 1, auto: 1, balFirst: 1 };
    PSA.setSettings = function (patch) {
      var u = me(); if (!u) return;
      var send = {};
      Object.keys(patch).forEach(function (k) { u.set[k] = patch[k]; if (SETS[k]) send[k] = patch[k]; });
      save();
      if (!Object.keys(send).length) return;
      return call('POST', '/account/settings', send).then(function (r) { if (!r.settings) fail(r, 'Настройки не сохранились. Попробуйте ещё раз'); });
    };
    PSA.startEmailChange = function (email) {
      var u = me(); email = normEmail(email);
      if (!u) return { err: 'auth' };
      if (email === u.email) return { err: 'Это ваш текущий email' };
      return call('POST', '/account/email/start', { email: email }).then(function (r) {
        if (r.ok) { u.pendingEmail = email; save(); return { ok: true }; }
        if (r.error === 'email_in_use') return { err: 'На этот email уже есть другой кабинет' };
        if (r.error === 'code_wait') return { err: 'Новый код можно запросить через ' + r.wait + ' с' };
        if (r.error === 'code_hour') return { err: 'Слишком много попыток. Новый код можно запросить через ' + Math.ceil(r.wait / 60) + ' мин' };
        return { err: r.message && r.message !== r.error ? r.message : 'Не получилось. Попробуйте ещё раз' };
      });
    };
    PSA.confirmEmailChange = function (code) {
      return call('POST', '/account/email/confirm', { code: String(code) }).then(function (r) {
        if (!r.ok) return r.error === 'email_in_use' ? { err: 'fail', text: 'На этот email уже есть другой кабинет' } : CODE_ERR(r);
        return load().then(function () { return { ok: true }; });
      });
    };
    PSA.cancelEmailChange = function () { var u = me(); if (u) { delete u.pendingEmail; save(); } return call('POST', '/account/email/cancel', {}); };
    PSA.deleteAccount = function () {
      return call('POST', '/account/delete', {}).then(function (r) {
        if (!r.ok) return fail(r, 'Не удалось удалить кабинет. Напишите в поддержку');
        mem = blank(); save();
        return { ok: true };
      });
    };

    /* ---------- Загрузка перед показом страницы ---------- */
    PSA.ready = (PS.qp('logout') ? PSA.logout() : Promise.resolve())
      .then(miniApp)
      .then(function () { return Promise.all([load(), authExtras()]); })
      .then(function () {
        var oid = PS.qp('o') || PS.qp('paid'), k = PS.qp('k');
        if (oid && !db().orders[oid] && k) return fetchOrder(oid, k).then(function () { save(); });
      })
      .catch(function (e) { try { console.error('[PSA] загрузка кабинета', e); } catch (x) {} });
    // Публичные страницы показываются сразу (PSA.fast) — после загрузки кабинета перерисовываем шапку и данные
    PSA.ready.then(function () { if (PS.refresh) PS.refresh(); });
  }
})(typeof window !== 'undefined' ? window : globalThis);

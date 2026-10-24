/*
  Данные сайта и мост к макетам. Подключается ДО runtime макетов.
  ВНИМАНИЕ: цены примерные (для вёрстки). В рабочей версии придут из API
  поставщика с наценкой — меняется только этот файл.

  Используется и в браузере (window.PS), и сборщиком (tools/build-site.mjs)
  для подстановки цен в статичный текст макетов.
*/
(function (root) {
  'use strict';
  var PS = root.PS = root.PS || {};

  /* ---------- Язык: русская версия в корне, английская — в /en/ (собирает tools/build-site.mjs) ---------- */
  PS.lang = root.PS_LANG === 'en' ? 'en' : 'ru';
  var EN = PS.lang === 'en';
  // Тот же адрес на другом языке
  PS.langUrl = function (to) {
    var l = root.location, p = l.pathname.replace(/^\/en(?=\/|$)/, '') || '/';
    return (to === 'en' ? '/en' : '') + p + l.search + l.hash;
  };
  // Выбор запоминается в браузере и в аккаунте (оттуда его берут письма, бот и Mini App)
  PS.switchLang = function (to) {
    try { root.localStorage.setItem('ps.lang', to); } catch (e) { /* приватный режим */ }
    var go = function () { root.location.href = PS.langUrl(to); };
    var r = root.PSA && root.PSA.authed && root.PSA.authed() ? root.PSA.setSettings({ lang: to }) : null;
    if (r && r.then) { r.then(go, go); setTimeout(go, 1500); } else go();
  };
  // Множественное число: в английском только «1 — остальные»
  PS.plural = function (n, one, few, many) {
    if (EN) return n === 1 ? one : many;
    return n % 10 === 1 && n % 100 !== 11 ? one : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many);
  };
  PS.dec = function (n) { return EN ? String(n) : String(n).replace('.', ','); };
  // Названия стран и регионов по-английски: код → [название, с артиклем] (assets/en/names.js)
  var NAMES = EN ? root.PS_EN_NAMES || {} : null;
  PS.enName = function (code, the) { var n = NAMES && NAMES[code]; return n ? n[the ? 1 : 0] : null; };

  /* ---------- Страны каталога (как в макете «Все страны») ---------- */
  // код: [название, «для …», «в …» (где), «в …» (куда), сеть, цена «от» (1 ГБ / 7 дней), регион, фото, подпись фото]
  var C = {
    TR: ['Турция', 'Турции', 'в Турции', 'в Турцию', '4G/5G', 390, 'XM', 'd851f3989ba3', 'Гёреме, Каппадокия'],
    AE: ['ОАЭ', 'ОАЭ', 'в ОАЭ', 'в ОАЭ', '5G', 450, 'XM', '90fcdba5', 'Бурдж‑Халифа, Дубай'],
    TH: ['Таиланд', 'Таиланда', 'в Таиланде', 'в Таиланд', '4G/5G', 350, 'XA', '1e6e74ca', 'Лодка‑лонгтейл, острова'],
    GE: ['Грузия', 'Грузии', 'в Грузии', 'в Грузию', '4G', 420, 'XC', 'c0c78459', 'Гергети, Казбеги'],
    EG: ['Египет', 'Египта', 'в Египте', 'в Египет', '4G', 490, 'XF', '7d2644e1', 'Пирамиды Гизы'],
    CN: ['Китай', 'Китая', 'в Китае', 'в Китай', '4G/5G', 520, 'XA', '33c3e784', 'Великая Китайская стена'],
    VN: ['Вьетнам', 'Вьетнама', 'во Вьетнаме', 'во Вьетнам', '4G/5G', 380, 'XA', '7e50c4ad', 'Бухта Халонг'],
    AM: ['Армения', 'Армении', 'в Армении', 'в Армению', '4G', 410, 'XC', 'e60b4049', 'Хор Вирап и Арарат'],
    GB: ['Великобритания', 'Великобритании', 'в Великобритании', 'в Великобританию', '4G/5G', 490, 'EU', 'af6de090', 'Биг‑Бен, Лондон'],
    US: ['США', 'США', 'в США', 'в США', '5G', 590, 'XN', 'e03900b5', 'Гранд‑Каньон, Аризона'],
    AU: ['Австралия', 'Австралии', 'в Австралии', 'в Австралию', '4G/5G', 590, 'XO', 'd1ea2224', 'Сиднейская гавань'],
    RU: ['Россия', 'России', 'в России', 'в Россию', 'для гостей страны', 450, 'EU', 'b0e889e9', 'Бурый медведь, дикая природа'],
    IN: ['Индия', 'Индии', 'в Индии', 'в Индию', '4G/5G', 440, 'XA', '', ''],
    ID: ['Индонезия · Бали', 'Индонезии', 'в Индонезии', 'в Индонезию', '4G', 420, 'XA', '', ''],
    ES: ['Испания', 'Испании', 'в Испании', 'в Испанию', '5G', 450, 'EU', '', ''],
    IT: ['Италия', 'Италии', 'в Италии', 'в Италию', '5G', 450, 'EU', '', ''],
    KZ: ['Казахстан', 'Казахстана', 'в Казахстане', 'в Казахстан', '4G', 390, 'XC', '', ''],
    CY: ['Кипр', 'Кипра', 'на Кипре', 'на Кипр', '4G/5G', 420, 'EU', '', ''],
    MV: ['Мальдивы', 'Мальдив', 'на Мальдивах', 'на Мальдивы', '4G', 690, 'XA', '', ''],
    NZ: ['Новая Зеландия', 'Новой Зеландии', 'в Новой Зеландии', 'в Новую Зеландию', '4G/5G', 620, 'XO', '9bfa41e0', 'Аораки / Маунт‑Кук'],
    UZ: ['Узбекистан', 'Узбекистана', 'в Узбекистане', 'в Узбекистан', '4G', 390, 'XC', '', ''],
    FR: ['Франция', 'Франции', 'во Франции', 'во Францию', '5G', 450, 'EU', '685c9726', 'Эйфелева башня, Париж'],
    ME: ['Черногория', 'Черногории', 'в Черногории', 'в Черногорию', '4G', 430, 'EU', '', ''],
    LK: ['Шри‑Ланка', 'Шри‑Ланки', 'на Шри‑Ланке', 'на Шри‑Ланку', '4G', 460, 'XA', '', ''],
    JP: ['Япония', 'Японии', 'в Японии', 'в Японию', '5G', 480, 'XA', '', ''],
    BR: ['Бразилия', 'Бразилии', 'в Бразилии', 'в Бразилию', '4G', 640, 'XL', '', '']
  };

  // Страны только в составе регионов (без своей страницы)
  var EXTRA = {
    DE: ['Германия', '4G/5G'], GR: ['Греция', '4G'], PT: ['Португалия', '4G/5G'], NL: ['Нидерланды', '4G/5G'], AT: ['Австрия', '4G/5G'],
    CH: ['Швейцария', '4G/5G'], CZ: ['Чехия', '4G'], PL: ['Польша', '4G'], HR: ['Хорватия', '4G'], BE: ['Бельгия', '4G/5G'], HU: ['Венгрия', '4G'],
    SE: ['Швеция', '4G/5G'], FI: ['Финляндия', '4G/5G'], NO: ['Норвегия', '4G/5G'], DK: ['Дания', '4G/5G'], IE: ['Ирландия', '4G/5G'],
    RS: ['Сербия', '4G'], BG: ['Болгария', '4G'], RO: ['Румыния', '4G'], SI: ['Словения', '4G'], SK: ['Словакия', '4G'], EE: ['Эстония', '4G/5G'],
    LV: ['Латвия', '4G/5G'], LT: ['Литва', '4G/5G'], MT: ['Мальта', '4G'], IS: ['Исландия', '4G'], LU: ['Люксембург', '4G/5G'], AL: ['Албания', '4G'],
    KR: ['Южная Корея', '4G/5G'], SG: ['Сингапур', '4G/5G'], MY: ['Малайзия', '4G'], PH: ['Филиппины', '4G'], HK: ['Гонконг', '4G/5G'], TW: ['Тайвань', '4G/5G'], KH: ['Камбоджа', '4G'],
    QA: ['Катар', '5G'], OM: ['Оман', '4G'], BH: ['Бахрейн', '4G'], KW: ['Кувейт', '4G'], SA: ['Саудовская Аравия', '4G/5G'], JO: ['Иордания', '4G'], IL: ['Израиль', '4G/5G'],
    MX: ['Мексика', '4G'], AR: ['Аргентина', '4G'], CL: ['Чили', '4G'], PE: ['Перу', '4G'], CO: ['Колумбия', '4G'], CR: ['Коста‑Рика', '4G'], DO: ['Доминикана', '4G'],
    CA: ['Канада', '4G/5G'], FJ: ['Фиджи', '4G'], PF: ['Французская Полинезия', '4G'],
    AZ: ['Азербайджан', '4G'], KG: ['Киргизия', '4G'], TJ: ['Таджикистан', '4G'],
    MA: ['Марокко', '4G'], TN: ['Тунис', '4G'], ZA: ['ЮАР', '4G'], KE: ['Кения', '4G'], TZ: ['Танзания', '4G'], MU: ['Маврикий', '4G'], SC: ['Сейшелы', '4G'], NG: ['Нигерия', '4G'], GH: ['Гана', '4G']
  };

  /* ---------- Регионы ---------- */
  // код: [название, «для …», цена «от», фото, подпись, страны (первые — с флагами в шапке)]
  var R = {
    EU: ['Европа', 'Европы', 590, '685c9726', 'Эйфелева башня, Париж', 'FR IT ES DE GB GR PT NL AT CH CZ ME CY TR PL HR BE HU SE FI NO DK IE RS BG RO SI SK EE LV LT MT IS LU AL'],
    XA: ['Азия', 'Азии', 690, '7e50c4ad', 'Бухта Халонг, Вьетнам', 'TH VN CN JP ID IN LK MV KR SG MY PH HK TW KH'],
    XM: ['Ближний Восток', 'Ближнего Востока', 690, '90fcdba5', 'Бурдж‑Халифа, Дубай', 'AE TR QA OM BH KW SA JO IL EG'],
    XL: ['Латинская Америка', 'Латинской Америки', 890, 'a2518d9c', 'Тукан, Коста‑Рика', 'BR MX AR CL PE CO CR DO'],
    XO: ['Океания', 'Океании', 790, '9bfa41e0', 'Аораки / Маунт‑Кук, Новая Зеландия', 'AU NZ FJ PF'],
    XN: ['Северная Америка', 'Северной Америки', 790, 'e03900b5', 'Гранд‑Каньон, США', 'US CA MX'],
    XC: ['Кавказ и Центральная Азия', 'Кавказа и Центральной Азии', 590, 'c0c78459', 'Гергети, Казбеги', 'GE AM AZ KZ UZ KG TJ'],
    XF: ['Африка', 'Африки', 790, '7d2644e1', 'Пирамиды Гизы', 'EG MA TN ZA KE TZ MU SC NG GH'],
    GL: ['Весь мир', 'всего мира', 990, '79cd7b90', 'Путешествие по миру', '*'],
    GX: ['Весь мир без Китая', 'всего мира без Китая', 950, '79cd7b90', 'Путешествие по миру', '*-CN']
  };
  // Синонимы кодов регионов из разных макетов
  var RALIAS = { AS: 'XA', LA: 'XL', OC: 'XO', NA: 'XN', EUR: 'EU' };

  PS.TOTAL = 190; // стран в каталоге поставщика

  var ALLCODES = Object.keys(C).concat(Object.keys(EXTRA));
  function regionCodes(rc) {
    var r = R[rc];
    if (!r) return [];
    if (r[5] === '*') return ALLCODES.slice();
    if (r[5] === '*-CN') return ALLCODES.filter(function (c) { return c !== 'CN'; });
    return r[5].split(' ');
  }
  function cName(code) { return C[code] ? C[code][0] : (EXTRA[code] ? EXTRA[code][0] : code); }
  function cNet(code) { return C[code] ? C[code][4] : (EXTRA[code] ? EXTRA[code][1] : '4G'); }

  PS.regionCount = function (rc) {
    rc = RALIAS[rc] || rc;
    if (rc === 'GL') return 150;
    if (rc === 'GX') return 145;
    return regionCodes(rc).length;
  };

  /* ---------- Цены ---------- */
  function round10(x) { return Math.ceil(x / 10) * 10; }
  PS.fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  PS.isRegion = function (code) { return !!R[RALIAS[code] || code]; };
  PS.base = function (code) {
    if (C[code]) return C[code][5];
    var rc = RALIAS[code] || code;
    return R[rc] ? R[rc][2] : 450;
  };
  PS.from = function (code) { return PS.fmt(PS.base(code)); };
  // Пакет «на весь срок»: n — ГБ, d — дней
  PS.priceTotal = function (code, n, d) {
    var k = n <= 0.1 ? 0.45 : n <= 0.5 ? (d <= 1 ? 0.5 : 0.7) : 0.55 + 0.45 * Math.pow(n, 0.85);
    k *= d >= 180 ? 1.5 : d >= 30 ? 1.08 : d >= 15 ? 1.03 : 1;
    return round10(PS.base(code) * k);
  };
  // Пакет «с лимитом в день»: цена за 1 день
  PS.priceDay = function (code, n) { return round10(PS.base(code) * (0.16 + 0.12 * Math.pow(n, 0.8))); };

  /* ---------- Текущее направление страницы (?c=TR или ?r=EU) ---------- */
  function q(k) { try { return new URLSearchParams(root.location.search).get(k); } catch (e) { return null; } }
  PS.country = function (code) {
    code = (code || q('c') || 'TR').toUpperCase();
    var c = C[code] || C.TR;
    if (!C[code]) code = 'TR';
    var reg = R[c[6]];
    return {
      code: code, name: c[0], gen: c[1], inn: c[2], to: c[3], net: c[4], from: PS.from(code),
      flag: 'assets/flags/' + code.toLowerCase() + '.svg',
      photo: 'assets/photos/' + (c[7] || reg[3]) + '.jpg',
      cap: (c[8] || reg[4]).toUpperCase(), alt: c[0] + ' — ' + (c[8] || reg[4]),
      place: c[8] ? code : '',
      region: c[6], regionName: reg[0]
    };
  };
  PS.region = function (code) {
    code = (code || q('r') || 'EU').toUpperCase();
    code = RALIAS[code] || code;
    if (!R[code]) code = 'EU';
    var r = R[code];
    var list = regionCodes(code).map(function (cc) { return [cc, cName(cc), cNet(cc)]; });
    return {
      code: code, name: r[0], gen: r[1], from: PS.from(code), n: PS.regionCount(code),
      photo: 'assets/photos/' + r[3] + '.jpg', cap: r[4].toUpperCase(),
      icon: code === 'EU' ? 'assets/flags/eu.svg' : PS.flagOf(list[0] && list[0][0]),
      list: list, head: list.slice(0, 7).map(function (x) { return x[0]; })
    };
  };
  PS.cName = cName;
  // Какие флаги есть в assets/flags (список дописывает сборщик в catalog.js)
  PS.flagOf = function (code) {
    var c = String(code || '').toLowerCase(), list = root.PS_FLAGS || '';
    return list.indexOf(' ' + c + ' ') !== -1 ? 'assets/flags/' + c + '.svg' : '';
  };
  PS.qp = function (k) { return q(k) || ''; };
  // «Где это»: код места → направление eSIM
  PS.placeCode = function (k) { return { EU: 'EU', LA: 'XL' }[k] || k; };
  PS.placeDest = function (k) { return PS.dest(PS.placeCode(k)); };

  // Код региона из разных макетов → наш код (на главной ME = Ближний Восток)
  PS.regionCode = function (code) { return { ME: 'XM', AS: 'XA', LA: 'XL', OC: 'XO', NA: 'XN' }[code] || code; };
  // Страница «Где это» для карточки главной
  PS.placeFor = function (code, isRegion) {
    var m = isRegion ? { EU: 'EU', LA: 'LA', AS: 'VN', ME: 'AE', OC: 'NZ', NA: 'US' } : {};
    var p = isRegion ? m[code] : code;
    return p ? 'place.html?place=' + p : '';
  };

  /* ---------- Пакет: из страницы страны в оформление ---------- */
  // t — total|daily, n — ГБ (число), d — дней
  PS.planLabel = function (t, n, d) {
    var gb = n < 1 ? Math.round(n * 1000) + '\u00a0МБ' : String(n).replace('.', ',') + '\u00a0ГБ';
    return (t === 'daily' ? gb + '/день' : gb) + ' · ' + PS.daysWord(d);
  };
  PS.daysWord = function (n) {
    return n + '\u00a0' + (n % 10 === 1 && n % 100 !== 11 ? 'день' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'дня' : 'дней'));
  };
  // Суточный тариф на d дней: точная цена дня (p.x, коп.) × d × скидка за срок (как у поставщика), и только потом
  // вверх до 10 ₽ (meta.roundToRub). Та же формула — dailyKopecks в apps/api/src/modules/pricing.ts
  PS.DAILY_DISCOUNT = [[30, 82], [20, 85], [10, 89], [5, 92], [1, 96]];
  PS.dailyTotal = function (p, d) {
    var pc = 100, meta = root.PS_CATALOG && root.PS_CATALOG.meta, step = ((meta && meta.roundToRub) || 10) * 100;
    for (var i = 0; i < PS.DAILY_DISCOUNT.length; i++) if (d >= PS.DAILY_DISCOUNT[i][0]) { pc = PS.DAILY_DISCOUNT[i][1]; break; }
    return Math.max(step, Math.ceil((p.x || p.price * 100) * d * pc / 100 / step) * step) / 100;
  };
  // Сколько клиент экономит на сроке: цена дня × d минус итог за d дней (показываем от 5 дней)
  PS.dailySave = function (p, d) {
    var base = PS.dailyTotal(p, 1) * d, save = base - PS.dailyTotal(p, d);
    return d >= 5 && save > 0 ? { rub: save, pct: Math.round(save / base * 100) } : null;
  };
  PS.dailySaveText = function (p, d) {
    var s = p && PS.dailySave(p, d);
    return s ? 'Скидка за срок' + ' −' + s.pct + '% · ' + 'экономия' + ' ' + PS.fmt(s.rub) + ' ₽' : '';
  };
  PS.planPrice = function (code, t, n, d) { return t === 'daily' ? PS.dailyTotal({ price: PS.priceDay(code, n) }, d) : PS.priceTotal(code, n, d); };
  PS.checkoutUrl = function (code, t, n, d) { return 'checkout.html?c=' + code + '&t=' + t + '&n=' + n + '&d=' + d; };
  PS.order = function () {
    var code = (q('c') || 'TR').toUpperCase();
    var t = q('t') === 'daily' ? 'daily' : 'total';
    var n = parseFloat(q('n')) || 5, d = parseInt(q('d'), 10) || 30;
    var isReg = PS.isRegion(code) && !C[code];
    var info = isReg ? PS.region(code) : PS.country(code);
    var price = PS.planPrice(info.code, t, n, d);
    return { code: info.code, isRegion: isReg, info: info, t: t, n: n, d: d, price: price, priceStr: PS.fmt(price), label: PS.planLabel(t, n, d), back: PS.dest(info.code) };
  };

  // Код для экрана «eSIM готова» и адреса страниц оплаты
  PS.successUrl = function (O) { return 'order.html?country=' + O.code; };
  // m — индекс способа оплаты в макете оформления: 0 баланс, 1 СБП, 2 USDT
  PS.payUrl = function (O, m) { return 'payment.html?variant=' + (m === 2 ? 'crypto' : 'pending') + '&c=' + O.code + '&t=' + O.t + '&n=' + O.n + '&d=' + O.d; };
  PS.checkoutBack = function () { var o = PS.order(); return PS.checkoutUrl(o.code, o.t, o.n, o.d); };
  PS.USDT_RATE = 79; // ₽ за 1 USDT — для вёрстки
  PS.usdt = function () { return (Math.ceil(PS.order().price / PS.USDT_RATE * 100) / 100 + 0.0013).toFixed(4).replace('.', ','); };
  // Склонения для экрана «eSIM готова»
  PS.successC = function (code) {
    if (!code) return null;
    code = String(code).toUpperCase();
    if (C[code]) { var c = C[code]; return { name: c[0], to: c[3].replace(' ', '\u00a0'), in: c[2].replace(' ', '\u00a0'), for: 'для\u00a0' + c[1], flag: 'assets/flags/' + code.toLowerCase() + '.svg' }; }
    var rc = RALIAS[code] || code;
    if (R[rc]) { var r = R[rc]; return { name: r[0], to: 'в\u00a0поездку', in: 'в\u00a0поездке', for: 'для\u00a0' + r[1], flag: rc === 'EU' ? 'assets/flags/eu.svg' : PS.flagOf(regionCodes(rc)[0]) }; }
    return null;
  };

  /* ============ Каталог поставщика (assets/catalog.js ← tools/sync-catalog.mjs) ============ */
  // Когда каталог загружен, цены, тарифы, страны и регионы берутся из него.
  var CAT = root.PS_CATALOG;
  // Английская версия: названия из каталога (он по-русски, как в API) — по коду страны
  function enCat(cat) {
    if (!EN || !cat || cat.en) return cat;
    Object.keys(cat.countries || {}).forEach(function (c) { var n = PS.enName(c); if (n) cat.countries[c].name = n; });
    Object.keys(cat.regions || {}).forEach(function (c) {
      var r = cat.regions[c], n = PS.enName(c), g = PS.enName(c, true);
      if (n) { r.name = n; r.gen = g; }
      (r.countries || []).forEach(function (x) { x[1] = PS.enName(x[0]) || x[1]; });
    });
    cat.en = true;
    return cat;
  }
  CAT = enCat(CAT);
  var CONT = { Europe: 'EU', Asia: 'XA', Africa: 'XF', 'North America': 'XN', 'South America': 'XL', Oceania: 'XO' };
  var ME_CODES = ' AE SA QA KW OM BH JO IL IQ IR LB YE SY PS ';
  var CA_CODES = ' AM GE AZ KZ UZ KG TJ TM ';

  // Склонение названий стран, которых нет в ручной таблице C (родительный, предложный, винительный)
  function decl(name) {
    var isl = name.match(/^(\S+?)(ие|ые) острова$/); // «Фарерские острова» → «Фарерских островов»
    if (isl) { var st = isl[1] + (isl[2] === 'ые' ? 'ых' : 'их'); return { gen: st + ' островов', inn: 'на\u00a0' + st + ' островах', to: 'на\u00a0' + name }; }
    var isl2 = name.match(/^(остров|острова) (.+)$/i); // «остров Мэн», «острова Кайман»
    if (isl2) { var one = /^остров$/i.test(isl2[1]); return { gen: (one ? 'острова ' : 'островов ') + isl2[2], inn: 'на\u00a0' + (one ? 'острове ' : 'островах ') + isl2[2], to: 'на\u00a0' + name }; }
    var words = name.split(' '), g = [], p = [], a = [];
    var noun = function (w) {
      if ((/[оеиуюэё]$/i.test(w) && !/ия$/.test(w)) || /уа$/.test(w)) return [w, w, w];
      if (/ия$/.test(w)) return [w.slice(0, -2) + 'ии', w.slice(0, -2) + 'ии', w.slice(0, -2) + 'ию'];
      if (/ья$/.test(w)) return [w.slice(0, -1) + 'и', w.slice(0, -1) + 'е', w.slice(0, -1) + 'ю'];
      if (/[гкхжшчщ]а$/.test(w)) return [w.slice(0, -1) + 'и', w.slice(0, -1) + 'е', w.slice(0, -1) + 'у'];
      if (/а$/.test(w)) return [w.slice(0, -1) + 'ы', w.slice(0, -1) + 'е', w.slice(0, -1) + 'у'];
      if (/я$/.test(w)) return [w.slice(0, -1) + 'и', w.slice(0, -1) + 'е', w.slice(0, -1) + 'ю'];
      if (/ы$/.test(w)) return [w.slice(0, -1), w.slice(0, -1) + 'ах', w];
      if (/[ьй]$/.test(w)) return [w.slice(0, -1) + 'я', w.slice(0, -1) + 'е', w];
      if (/[бвгджзклмнпрстфхцчшщ]$/.test(w)) return [w + 'а', w + 'е', w];
      return [w, w, w];
    };
    var adj = function (w) {
      if (/ая$/.test(w)) return [w.slice(0, -2) + 'ой', w.slice(0, -2) + 'ой', w.slice(0, -2) + 'ую'];
      if (/ое$/.test(w)) return [w.slice(0, -2) + 'ого', w.slice(0, -2) + 'ом', w];
      if (/[ыи]й$/.test(w)) return [w.slice(0, -2) + 'ого', w.slice(0, -2) + 'ом', w];
      if (/[ыи]е$/.test(w)) return [w.slice(0, -2) + 'ых', w.slice(0, -2) + 'ых', w];
      return null;
    };
    words.forEach(function (w, i) {
      if (/^(и|—|-)$/.test(w)) { g.push(w); p.push(w); a.push(w); return; }
      var f = (i < words.length - 1 && adj(w)) || noun(w); // «Новой Зеландии», «Боснии и Герцеговины»
      g.push(f[0]); p.push(f[1]); a.push(f[2]);
    });
    var vo = /^[ВвФф][^аеёиоуыэюяАЕЁИОУЫЭЮЯ]/.test(name) ? 'во ' : 'в ';
    return { gen: g.join(' '), inn: vo + p.join(' '), to: vo + a.join(' ') };
  }

  var GBL = function (n) { return n < 1 ? Math.round(n * 1024 / 50) * 50 + ' МБ' : String(n).replace('.', ',') + ' ГБ'; };
  var USE = function (n) { return n <= 0.5 ? 'мессенджеры и карты' : n <= 1 ? 'соцсети и навигация' : n <= 2 ? 'фото, видео время от времени' : n <= 3 ? 'активно каждый день' : n <= 5 ? 'видео и раздача' : 'работа и стриминг'; };
  PS.nStran = function (n) { return n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'страна' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'страны' : 'стран')); };

  function catEntry(code) { return CAT && (CAT.countries[code] || CAT.regions[RALIAS[code] || code]) || null; }

  if (CAT) {
    PS.TOTAL = Math.floor(Object.keys(CAT.countries).length / 10) * 10;
    var baseOld = PS.base;
    PS.base = function (code) { var e = catEntry(code); return e ? e.from : baseOld(code); };
    var isRegOld = PS.isRegion;
    PS.isRegion = function (code) { code = RALIAS[code] || code; return !!CAT.regions[code] || isRegOld(code); };
    PS.regionCount = function (code) { var r = CAT.regions[RALIAS[code] || code]; return r ? r.countries.length : 0; };

    var countryOld = PS.country;
    PS.country = function (code) {
      code = (code || q('c') || 'TR').toUpperCase();
      var k = CAT.countries[code];
      if (!k) { code = 'TR'; k = CAT.countries.TR; }
      var o;
      if (C[code]) o = countryOld(code);
      else {
        var rc = CONT[k.cont] || 'GL', reg = R[rc] || R.GL, d = decl(k.name);
        o = { code: code, name: k.name, gen: d.gen, inn: d.inn, to: d.to,
          photo: 'assets/photos/' + reg[3] + '.jpg', cap: reg[4].toUpperCase(), alt: k.name, place: '', region: rc, regionName: reg[0] };
      }
      o.net = k.net; o.ops = k.ops || []; o.from = PS.fmt(k.from); o.flag = PS.flagOf(code);
      return o;
    };

    var regionOld = PS.region;
    PS.region = function (code) {
      code = RALIAS[(code || q('r') || 'EU').toUpperCase()] || (code || q('r') || 'EU').toUpperCase();
      var k = CAT.regions[code];
      if (!k) { code = 'EU'; k = CAT.regions.EU; }
      var o = regionOld(code);
      o.name = k.name; o.gen = k.gen; o.from = PS.fmt(k.from); o.n = k.countries.length; o.net = k.net;
      o.list = k.countries.slice();
      o.head = o.list.slice(0, 7).map(function (x) { return x[0]; });
      o.icon = code === 'EU' ? 'assets/flags/eu.svg' : PS.flagOf(o.head[0]);
      return o;
    };

    // Тарифы в формате макета (RAW.total / RAW.daily)
    PS.plans = function (code) {
      var e = catEntry(code) || CAT.countries.TR;
      var total = e.plans.total.map(function (p) {
        return { gb: GBL(p.n), days: PS.daysWord(p.d), daysShort: p.d + ' ДН', total: 'на весь срок', n: p.n, price: p.p, code: p.c, top: p.t, more: p.n < 1 || p.d >= 90 };
      });
      var main = total.filter(function (p) { return !p.more; });
      main.slice(8).forEach(function (p) { p.more = true; });
      var hit = main.filter(function (p) { return p.n === 5 && p.daysShort === '30 ДН'; })[0] || main.filter(function (p) { return p.n >= 3; })[0] || main[0] || total[0];
      if (hit) hit.hit = true;
      var daily = e.plans.daily.map(function (p) {
        return { gb: GBL(p.n) + '/день', days: p.f ? 'после лимита ' + p.f : 'после лимита скорость снижается', total: USE(p.n), n: p.n, price: p.p, x: p.x, code: p.c, top: p.t, gbShort: (GBL(p.n) + '/день').toUpperCase() };
      });
      var dh = daily.filter(function (p) { return p.n === 1; })[0] || daily[0];
      if (dh) dh.hit = true;
      return { total: total, daily: daily };
    };
    // Цена тарифа «N ГБ на D дней» (ближайший по объёму и сроку)
    PS.priceOf = function (code, n, d) {
      var t = PS.plans(code).total, best = t[0];
      t.forEach(function (p) { var dd = parseInt(p.daysShort, 10); if (Math.abs(p.n - n) + Math.abs(dd - d) / 30 < Math.abs(best.n - n) + Math.abs(parseInt(best.daysShort, 10) - d) / 30) best = p; });
      return best ? best.price : PS.base(code);
    };
    PS.planSel = function (code) {
      var pl = PS.plans(code);
      var ti = pl.total.findIndex(function (p) { return p.hit; }), di = pl.daily.findIndex(function (p) { return p.hit; });
      return { type: pl.total.length ? 'total' : 'daily', total: Math.max(0, ti), daily: Math.max(0, di) };
    };

    // Каталог «Все страны»: страны, регионы, группы для фильтра
    PS.catalogAll = function () {
      var countries = Object.keys(CAT.countries).map(function (c) { return [c, C[c] ? C[c][0] : CAT.countries[c].name, CAT.countries[c].net]; })
        .sort(function (a, b) { return a[1].localeCompare(b[1], 'ru'); });
      var reg = ['EU', 'XA', 'XM', 'XL', 'XO', 'XN', 'XC', 'XF'].filter(function (c) { return CAT.regions[c]; })
        .map(function (c) { return [c, CAT.regions[c].name, PS.nStran(CAT.regions[c].countries.length)]; });
      var world = ['GL', 'GX'].filter(function (c) { return CAT.regions[c]; })
        .map(function (c) { return [c, CAT.regions[c].name, PS.nStran(CAT.regions[c].countries.length)]; });
      return { countries: countries, regions: reg, world: world };
    };
    PS.catalogGroups = function () {
      var g = {};
      Object.keys(CAT.countries).forEach(function (c) {
        var cont = CAT.countries[c].cont;
        g[c] = ME_CODES.indexOf(' ' + c + ' ') !== -1 ? 'me' : CA_CODES.indexOf(' ' + c + ' ') !== -1 ? 'ca'
          : cont === 'Europe' ? 'eu' : cont === 'Asia' ? 'as' : cont === 'Africa' ? 'af' : cont === 'Oceania' ? 'oc' : 'am';
      });
      return g;
    };

    // Заказ: ?c=TR&pkg=КОД[&d=дней для суточных]
    PS.findPlan = function (code, pkg) {
      var pl = PS.plans(code), i;
      for (i = 0; i < pl.total.length; i++) if (pl.total[i].code === pkg) return { t: 'total', p: pl.total[i] };
      for (i = 0; i < pl.daily.length; i++) if (pl.daily[i].code === pkg) return { t: 'daily', p: pl.daily[i] };
      var hit = pl.total.filter(function (p) { return p.hit; })[0] || pl.total[0];
      return hit ? { t: 'total', p: hit } : { t: 'daily', p: pl.daily[0] };
    };
    PS.checkoutUrl = function (code, pkg, d) { return 'checkout.html?c=' + code + '&pkg=' + encodeURIComponent(pkg) + (d ? '&d=' + d : ''); };
    PS.order = function () {
      var code = (q('c') || 'TR').toUpperCase();
      var isReg = !!CAT.regions[RALIAS[code] || code] && !CAT.countries[code];
      var info = isReg ? PS.region(code) : PS.country(code);
      var f = PS.findPlan(info.code, q('pkg'));
      var d = f.t === 'daily' ? Math.min(90, Math.max(1, parseInt(q('d'), 10) || 10)) : parseInt(f.p.daysShort, 10);
      var price = f.t === 'daily' ? PS.dailyTotal(f.p, d) : f.p.price;
      return { code: info.code, isRegion: isReg, info: info, t: f.t, n: f.p.n, d: d, pkg: f.p.code, price: price, priceStr: PS.fmt(price), save: f.t === 'daily' ? PS.dailySaveText(f.p, d) : '',
        label: (f.t === 'daily' ? f.p.gb : f.p.gb) + ' · ' + PS.daysWord(d), back: PS.dest(info.code) };
    };
    PS.payUrl = function (O, m) { return 'payment.html?variant=' + (m === 2 ? 'crypto' : 'pending') + '&c=' + O.code + '&pkg=' + encodeURIComponent(O.pkg) + (O.t === 'daily' ? '&d=' + O.d : ''); };
    PS.checkoutBack = function () { var o = PS.order(); return PS.checkoutUrl(o.code, o.pkg, o.t === 'daily' ? o.d : 0); };
    // Курс оплаты в USDT (Rapira − 7%); в старых снимках каталога его нет — тогда курс Rapira
    if (CAT.meta && (CAT.meta.usdtRate || CAT.meta.usdRub)) PS.USDT_RATE = Math.round((CAT.meta.usdtRate || CAT.meta.usdRub) * 100) / 100;

    var successOld = PS.successC;
    PS.successC = function (code) {
      if (!code) return null;
      code = String(code).toUpperCase();
      if (C[code] || !CAT.countries[code]) return successOld(code);
      var c = PS.country(code);
      return { name: c.name, to: c.to, in: c.inn, for: 'для ' + c.gen, flag: c.flag };
    };
  }

  /* ---------- Живой каталог с API: приходит после показа страницы ---------- */
  // Страница рисуется сразу по снимку assets/catalog.js, свежие цены подставляются без перезагрузки
  PS.setCatalog = function (cat) {
    if (!cat || !cat.countries || !CAT) return false;
    CAT = root.PS_CATALOG = enCat(cat);
    PS.TOTAL = Math.floor(Object.keys(cat.countries).length / 10) * 10;
    if (cat.meta && (cat.meta.usdtRate || cat.meta.usdRub)) PS.USDT_RATE = Math.round((cat.meta.usdtRate || cat.meta.usdRub) * 100) / 100;
    return true;
  };
  // Перерисовать экран (данные кабинета или цены обновились)
  PS.refresh = function () {
    try { root.dispatchEvent(new root.Event('ps:refresh')); } catch (e) {}
  };

  /* ---------- Поиск направления: страна, регион, город, остров, штат ---------- */
  // Места → код страны. Ищем по началу слова, без учёта регистра, «ё» и дефисов
  var PLACES = 'TR:стамбул,анталья,анталия,аланья,кемер,белек,сиде,бодрум,мармарис,фетхие,даламан,измир,каппадокия,гёреме,анкара,трабзон,дидим,кушадасы,istanbul,antalya,alanya;' +
    'AE:дубай,абу-даби,абудаби,шарджа,рас-эль-хайма,фуджейра,аджман,эмираты,dubai,abu dhabi;' +
    'TH:пхукет,бангкок,паттайя,самуи,панган,краби,чиангмай,чианг май,ко чанг,ко тао,хуахин,као лак,phuket,bangkok,pattaya,samui;' +
    'EG:шарм-эль-шейх,шарм,хургада,каир,марса-алам,дахаб,макади,сома-бей,эль-гуна,луксор,александрия,sharm,hurghada,cairo;' +
    'CN:пекин,шанхай,хайнань,санья,гуанчжоу,шэньчжэнь,харбин,сиань,чэнду,ханчжоу,beijing,shanghai,hainan;' +
    'VN:нячанг,фукуок,ханой,хошимин,сайгон,дананг,фантьет,муйне,халонг,nha trang,phu quoc,hanoi;' +
    'GE:тбилиси,батуми,кутаиси,казбеги,гудаури,бакуриани,мцхета,сигнахи,кобулети,tbilisi,batumi;' +
    'AM:ереван,севан,гюмри,дилижан,цахкадзор,yerevan;' +
    'AZ:баку,габала,шеки,baku;' +
    'KZ:алматы,алма-ата,астана,шымкент,актау,медеу,almaty,astana;' +
    'UZ:ташкент,самарканд,бухара,хива,фергана,tashkent,samarkand;' +
    'KG:бишкек,иссык-куль,чолпон-ата,каракол,bishkek;' +
    'TJ:душанбе;BY:минск,брест,гродно,витебск,minsk;' +
    'ID:бали,джакарта,ломбок,гили,убуд,чангу,кута,нуса дуа,ява,bali,jakarta,lombok;' +
    'IN:гоа,дели,нью-дели,мумбаи,агра,керала,джайпур,goa,delhi,mumbai;' +
    'LK:коломбо,хиккадува,унаватуна,бентота,велигама,мирисса,канди,colombo;' +
    'MV:мале,male;MU:маврикий;SC:сейшелы,маэ,праслин;TZ:занзибар,дар-эс-салам,килиманджаро,zanzibar;' +
    'JP:токио,осака,киото,хоккайдо,окинава,саппоро,нара,фудзи,tokyo,osaka,kyoto;' +
    'KR:сеул,пусан,чеджу,seoul,busan,jeju;' +
    'MY:куала-лумпур,лангкави,пенанг,борнео,kuala lumpur;SG:сингапур,singapore;' +
    'PH:манила,боракай,себу,палаван,бохоль,manila,boracay;KH:пномпень,сиемреап,ангкор,сиануквиль;LA:вьентьян,луангпрабанг;' +
    'HK:гонконг,hong kong;MO:макао,macau;TW:тайбэй,taipei;MN:улан-батор;NP:катманду,эверест,покхара;' +
    'IL:тель-авив,иерусалим,эйлат,хайфа,мертвое море,tel aviv;JO:амман,акаба,петра,вади-рам;' +
    'SA:эр-рияд,джидда,мекка,медина,riyadh;QA:доха,doha;OM:маскат,салала,muscat;BH:манама;KW:эль-кувейт;' +
    'MA:марракеш,касабланка,агадир,фес,танжер,marrakech;TN:тунис,джерба,сусс,хаммамет,монастир,djerba;' +
    'ZA:кейптаун,йоханнесбург,cape town;KE:найроби,момбаса,кения;' +
    'FR:париж,ницца,канны,марсель,лион,корсика,лазурный берег,бордо,шамони,paris,nice;' +
    'IT:рим,милан,венеция,флоренция,неаполь,сицилия,сардиния,римини,тоскана,капри,доломиты,rome,milan,venice;' +
    'ES:барселона,мадрид,тенерифе,майорка,ибица,канары,канарские острова,гран-канария,коста-брава,коста-дель-соль,малага,валенсия,севилья,аликанте,бенидорм,barcelona,madrid,tenerife,mallorca,ibiza;' +
    'PT:лиссабон,порту,мадейра,алгарве,азорские острова,lisbon,porto;' +
    'GR:афины,крит,родос,корфу,санторини,халкидики,закинф,кос,миконос,салоники,athens,crete,rhodes,santorini;' +
    'CY:ларнака,лимассол,айя-напа,пафос,никосия,протарас,larnaca,limassol;' +
    'ME:будва,бар,котор,тиват,херцег-нови,подгорица,петровац,ульцинь,budva;' +
    'RS:белград,нови-сад,златибор,belgrade;HR:дубровник,сплит,загреб,истрия,пула,dubrovnik,split;' +
    'BA:сараево,мостар;AL:тирана,дуррес,саранда,влёра;MK:скопье,охрид;BG:софия,варна,бургас,солнечный берег,золотые пески,банско,несебр;' +
    'RO:бухарест,брашов,трансильвания;HU:будапешт,хевиз,балатон,budapest;CZ:прага,карловы вары,брно,prague;SK:братислава,татры;' +
    'AT:вена,зальцбург,инсбрук,тироль,vienna;CH:цюрих,женева,церматт,люцерн,берн,zurich,geneva;' +
    'DE:берлин,мюнхен,франкфурт,гамбург,кёльн,дрезден,бавария,berlin,munich;NL:амстердам,роттердам,гаага,amsterdam;' +
    'BE:брюссель,брюгге,антверпен;LU:люксембург;GB:лондон,эдинбург,манчестер,ливерпуль,шотландия,англия,уэльс,london;' +
    'IE:дублин,dublin;IS:рейкьявик,исландия;NO:осло,берген,лофотены,тромсё;SE:стокгольм,гётеборг;FI:хельсинки,лапландия,рованиеми;DK:копенгаген;' +
    'PL:варшава,краков,гданьск;EE:таллин;LV:рига,юрмала;LT:вильнюс;SI:любляна,блед;MT:валлетта;MC:монте-карло;VA:ватикан;SM:сан-марино;AD:андорра-ла-велья;' +
    'US:нью-йорк,лос-анджелес,майами,лас-вегас,сан-франциско,чикаго,вашингтон,бостон,сиэтл,гавайи,гонолулу,флорида,калифорния,техас,невада,аляска,орландо,new york,los angeles,miami,hawaii,california,florida;' +
    'CA:торонто,ванкувер,монреаль,оттава,toronto,vancouver;MX:канкун,мехико,тулум,плайя-дель-кармен,cancun;' +
    'CU:гавана,варадеро;DO:пунта-кана,санто-доминго,пуэрто-плата,punta cana;JM:ямайка;' +
    'BR:рио-де-жанейро,рио,сан-паулу,rio;AR:буэнос-айрес,патагония;CL:сантьяго,атакама;PE:лима,куско,мачу-пикчу;CO:богота,картахена,медельин;' +
    'CR:сан-хосе;PA:панама;EC:кито,галапагосы;' +
    'AU:сидней,мельбурн,брисбен,перт,голд-кост,sydney,melbourne;NZ:окленд,веллингтон,квинстаун,auckland;PF:таити,бора-бора;FJ:нади;' +
    'RU:москва,санкт-петербург,питер,сочи,калининград,крым,moscow';
  var PLACE = null;
  function norm(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[ ‐-―‑\-_.,·«»"']/g, ' ').replace(/\s+/g, ' ').trim(); }
  // Набрали в английской раскладке: «nehwbz» → «турция»
  var EN = 'qwertyuiop[]asdfghjkl;\'zxcvbnm,.`', RU = 'йцукенгшщзхъфывапролджэячсмитьбюё';
  function swapLayout(s) { return String(s).toLowerCase().split('').map(function (ch) { var i = EN.indexOf(ch); return i < 0 ? ch : RU.charAt(i); }).join(''); }
  function places() {
    if (PLACE) return PLACE;
    PLACE = [];
    PLACES.split(';').forEach(function (part) {
      var p = part.split(':'); if (p.length < 2) return;
      p[1].split(',').forEach(function (n) { if (n) PLACE.push([p[0], n.trim()]); });
    });
    return PLACE;
  }
  var dnRu = null, dnEn = null;
  try { dnRu = new Intl.DisplayNames(['ru'], { type: 'region' }); dnEn = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) {}
  // Популярность для сортировки равных совпадений (чаще ездят из России)
  PS.POPULAR = ['TR', 'AE', 'TH', 'EG', 'CN', 'VN', 'GE', 'AM', 'ID', 'KZ', 'UZ', 'MV', 'LK', 'IN', 'RS', 'ME', 'JP', 'KR', 'AZ', 'KG', 'CY', 'IT', 'ES', 'FR', 'GR', 'DE', 'US', 'BY', 'TZ', 'MY'];
  function score(nameN, q) {
    if (!nameN || !q) return 0;
    if (nameN === q) return 4;
    if (nameN.indexOf(q) === 0) return 3;
    if ((' ' + nameN).indexOf(' ' + q) !== -1) return 2;
    return q.length >= 3 && nameN.indexOf(q) !== -1 ? 1 : 0;
  }
  // q → [{ code, name, via, region, href, flag, price }], лучшие сверху
  PS.search = function (q, limit) {
    var cat = CAT || { countries: {}, regions: {} };
    var tries = [norm(q)];
    var sw = norm(swapLayout(q)); if (sw !== tries[0]) tries.push(sw);
    var best = {};
    function add(code, s, via, isReg) {
      if (!s) return;
      var k = (isReg ? 'r:' : 'c:') + code, cur = best[k];
      if (!cur || s > cur.s || (s === cur.s && !via && cur.via)) best[k] = { code: code, s: s, via: via || '', isReg: !!isReg };
    }
    for (var t = 0; t < tries.length; t++) {
      var qq = tries[t]; if (!qq) continue;
      Object.keys(cat.countries).forEach(function (c) {
        var names = [C[c] ? C[c][0] : cat.countries[c].name, cat.countries[c].name];
        if (dnRu) try { names.push(dnRu.of(c)); names.push(dnEn.of(c)); } catch (e) {}
        var s = 0; names.forEach(function (n) { s = Math.max(s, score(norm(n), qq)); });
        add(c, s, '', false);
      });
      Object.keys(cat.regions).forEach(function (r) { add(r, score(norm(cat.regions[r].name), qq), '', true); });
      places().forEach(function (p) {
        if (!cat.countries[p[0]]) return;
        var s = score(norm(p[1]), qq);
        if (s) add(p[0], s, p[1], false);
      });
      if (Object.keys(best).length) break; // в своей раскладке что-то нашлось — вторую не пробуем
    }
    var pop = function (c) { var i = PS.POPULAR.indexOf(c); return i < 0 ? 99 : i; };
    return Object.keys(best).map(function (k) { return best[k]; })
      .sort(function (a, b) { return b.s - a.s || pop(a.code) - pop(b.code) || (a.isReg - b.isReg); })
      .slice(0, limit || 8)
      .map(function (x) {
        var e = x.isReg ? cat.regions[x.code] : cat.countries[x.code];
        var name = x.isReg ? e.name : (C[x.code] ? C[x.code][0] : e.name);
        var via = x.via ? x.via.replace(/(^|[\s-])([а-яa-z])/g, function (m, a, b) { return a + b.toUpperCase(); }) : '';
        return { key: (x.isReg ? 'r:' : 'c:') + x.code, code: x.code, name: name, via: via, isRegion: x.isReg, href: PS.dest(x.code), flag: x.isReg ? (x.code === 'EU' ? PS.flagOf('eu') : '') : PS.flagOf(x.code), price: PS.fmt(e.from),
          sub: x.isReg ? PS.nStran(e.countries.length) : (e.net || '') };
      });
  };

  /* ---------- Общие значения для всех экранов ---------- */
  PS.vals = function () { return { psSellerLine: PS.sellerLine() }; };

  /* ---------- Ссылки ---------- */
  PS.dest = function (code) {
    if (!code) return 'countries.html';
    code = code.toUpperCase();
    if (code === 'EU' || PS.isRegion(code)) return 'region.html?r=' + (RALIAS[code] || code);
    return 'country.html?c=' + code;
  };
  PS.go = function (url) { root.location.href = url; };

  /* ---------- Реквизиты из config.js ---------- */
  PS.seller = function () {
    var s = (root.SITE_CONFIG && root.SITE_CONFIG.seller) || {};
    return s;
  };
  PS.sellerFields = function () {
    var s = PS.seller();
    return { name: s.name || '[ИП Фамилия Имя Отчество]', inn: s.inn || '[ИНН]', ogrn: s.ogrn || '[ОГРНИП]', address: s.address || '[Адрес]' };
  };
  PS.sellerLine = function () {
    var s = PS.seller();
    var parts = [s.name, s.inn && 'ИНН ' + s.inn, s.address].filter(Boolean);
    return parts.length ? ' · ' + parts.join(', ') : '';
  };

  /* ---------- Параметры экрана из адреса ---------- */
  // payment.html?variant=failed, order.html?country=TR, place.html?place=GE, checkout.html?lowBalance=true
  var FREE = { country: 1 };
  PS.applyUrlProps = function () {
    var el = root.document.querySelector('script[data-dc-script]');
    if (!el) return;
    var props;
    try { props = JSON.parse(el.getAttribute('data-props') || '{}'); } catch (e) { return; }
    var qs = new URLSearchParams(root.location.search);
    Object.keys(props).forEach(function (k) {
      if (k.charAt(0) === '$' || !qs.has(k)) return;
      var v = qs.get(k), meta = props[k];
      if (meta.editor === 'boolean') meta.default = v === 'true' || v === '1';
      else if (meta.editor === 'enum') {
        if ((meta.options || []).indexOf(v) !== -1 || FREE[k]) meta.default = v;
      } else meta.default = v;
    });
    el.setAttribute('data-props', JSON.stringify(props));
  };

  /* ---------- Поиск на главной → каталог с запросом ---------- */
  if (root.document) {
    var searchGo = function (input) {
      var v = (input.value || '').trim();
      // Нашлось направление (страна, регион, город, остров) — сразу на его страницу
      var best = v && PS.search ? PS.search(v, 1)[0] : null;
      PS.go(best ? best.href : 'countries.html' + (v ? '?q=' + encodeURIComponent(v) : ''));
    };
    root.document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href="countries.html"]');
      if (!a || !a.parentElement) return;
      var input = a.parentElement.querySelector('input[type="search"]');
      if (!input) return;
      e.preventDefault();
      searchGo(input);
    });
    root.document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || !e.target.matches || !e.target.matches('input[type="search"]')) return;
      var a = e.target.parentElement && e.target.parentElement.querySelector('a[href="countries.html"]');
      if (a) { e.preventDefault(); searchGo(e.target); }
    });
  }

  /* ---------- Английская версия: названия и предлоги по коду направления ---------- */
  if (EN) {
    var the = function (o) {
      var n = PS.enName(o.code), g = PS.enName(o.code, true);
      if (n) { o.name = n; o.alt = n; }
      if (g) { o.gen = g; o.inn = 'in\u00a0' + g; o.to = 'to\u00a0' + g; }
      return o;
    };
    var countryRu = PS.country, regionRu = PS.region, successRu = PS.successC;
    PS.country = function (code) { return the(countryRu(code)); };
    PS.region = function (code) {
      var o = regionRu(code), n = PS.enName(o.code), g = PS.enName(o.code, true);
      if (n) { o.name = n; o.gen = g; }
      o.list = o.list.map(function (x) { return [x[0], PS.enName(x[0]) || x[1], x[2]]; });
      return o;
    };
    PS.successC = function (code) {
      var o = successRu(code);
      if (!o) return o;
      var c = PS.isRegion(String(code).toUpperCase()) ? null : String(code).toUpperCase(), r = c ? null : PS.regionCode(String(code).toUpperCase());
      var n = PS.enName(c || r), g = PS.enName(c || r, true);
      if (n) o.name = n;
      if (g) { o.for = 'for\u00a0' + g; if (c) { o.to = 'to\u00a0' + g; o.in = 'in\u00a0' + g; } }
      return o;
    };
    var cNameRu = PS.cName;
    PS.cName = function (code) { return PS.enName(code) || cNameRu(code); };
  }

  // Runtime не перечитывает страницу сетевым запросом — шаблон уже в документе
  if (root.document) root.__resources = root.__resources || {};
})(typeof window !== 'undefined' ? window : globalThis);

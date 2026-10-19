/*
  Каталог для вёрстки: страны, регионы, тарифы, телефоны.
  ВНИМАНИЕ: цены примерные. Когда подключится бэкенд, каталог будет приходить из API
  поставщика (eSIM Access) с наценкой — этот файл тогда не понадобится.

  Страна: [код, название, часть света, цена «от» (₽, пакет 1 ГБ / 7 дней), сеть, синонимы для поиска]
*/
(function () {
  'use strict';

  var COUNTRIES = [
    // Популярные
    ['tr', 'Турция', 'mideast', 390, '4G/5G', 'стамбул анталья'],
    ['ae', 'ОАЭ', 'mideast', 450, '5G', 'эмираты дубай абу-даби'],
    ['th', 'Таиланд', 'asia', 350, '4G/5G', 'тайланд пхукет бангкок'],
    ['ge', 'Грузия', 'cis', 420, '4G', 'тбилиси батуми'],
    ['eg', 'Египет', 'africa', 490, '4G', 'хургада шарм'],
    ['vn', 'Вьетнам', 'asia', 380, '4G', 'нячанг фукуок'],
    ['cn', 'Китай', 'asia', 520, '4G/5G', 'пекин шанхай'],
    ['am', 'Армения', 'cis', 410, '4G', 'ереван'],
    // Европа
    ['fr', 'Франция', 'europe', 450, '4G/5G', 'париж'],
    ['it', 'Италия', 'europe', 450, '4G/5G', 'рим милан'],
    ['es', 'Испания', 'europe', 450, '4G/5G', 'барселона мадрид'],
    ['de', 'Германия', 'europe', 450, '4G/5G', 'берлин'],
    ['gb', 'Великобритания', 'europe', 490, '4G/5G', 'англия лондон'],
    ['gr', 'Греция', 'europe', 440, '4G/5G', 'крит афины'],
    ['pt', 'Португалия', 'europe', 450, '4G/5G', 'лиссабон'],
    ['nl', 'Нидерланды', 'europe', 450, '4G/5G', 'голландия амстердам'],
    ['cz', 'Чехия', 'europe', 440, '4G/5G', 'прага'],
    ['at', 'Австрия', 'europe', 450, '4G/5G', 'вена'],
    ['ch', 'Швейцария', 'europe', 590, '4G/5G', ''],
    ['pl', 'Польша', 'europe', 430, '4G/5G', 'варшава'],
    ['hu', 'Венгрия', 'europe', 440, '4G', 'будапешт'],
    ['fi', 'Финляндия', 'europe', 450, '4G/5G', 'хельсинки'],
    ['no', 'Норвегия', 'europe', 520, '4G/5G', ''],
    ['se', 'Швеция', 'europe', 480, '4G/5G', ''],
    ['dk', 'Дания', 'europe', 480, '4G/5G', ''],
    ['ie', 'Ирландия', 'europe', 480, '4G/5G', ''],
    ['be', 'Бельгия', 'europe', 450, '4G/5G', ''],
    ['hr', 'Хорватия', 'europe', 440, '4G', ''],
    ['me', 'Черногория', 'europe', 430, '4G', 'будва'],
    ['rs', 'Сербия', 'europe', 410, '4G', 'белград'],
    ['cy', 'Кипр', 'europe', 420, '4G/5G', 'лимассол'],
    ['mt', 'Мальта', 'europe', 450, '4G', ''],
    ['is', 'Исландия', 'europe', 560, '4G', ''],
    ['ee', 'Эстония', 'europe', 430, '4G/5G', ''],
    ['lv', 'Латвия', 'europe', 430, '4G/5G', 'рига'],
    ['lt', 'Литва', 'europe', 430, '4G/5G', ''],
    ['bg', 'Болгария', 'europe', 420, '4G', ''],
    ['ro', 'Румыния', 'europe', 420, '4G', ''],
    ['si', 'Словения', 'europe', 440, '4G', ''],
    ['sk', 'Словакия', 'europe', 440, '4G', ''],
    // Азия
    ['jp', 'Япония', 'asia', 480, '4G/5G', 'токио'],
    ['kr', 'Южная Корея', 'asia', 470, '4G/5G', 'корея сеул'],
    ['id', 'Индонезия', 'asia', 420, '4G', 'бали'],
    ['my', 'Малайзия', 'asia', 400, '4G', 'куала-лумпур'],
    ['sg', 'Сингапур', 'asia', 420, '4G/5G', ''],
    ['ph', 'Филиппины', 'asia', 430, '4G', ''],
    ['in', 'Индия', 'asia', 440, '4G', 'гоа'],
    ['lk', 'Шри-Ланка', 'asia', 460, '4G', 'цейлон'],
    ['mv', 'Мальдивы', 'asia', 690, '4G', ''],
    ['hk', 'Гонконг', 'asia', 420, '4G/5G', ''],
    ['tw', 'Тайвань', 'asia', 440, '4G/5G', ''],
    ['kh', 'Камбоджа', 'asia', 420, '4G', ''],
    ['np', 'Непал', 'asia', 480, '4G', ''],
    ['mn', 'Монголия', 'asia', 520, '4G', ''],
    // Ближний Восток
    ['il', 'Израиль', 'mideast', 450, '4G/5G', 'тель-авив'],
    ['jo', 'Иордания', 'mideast', 480, '4G', ''],
    ['qa', 'Катар', 'mideast', 480, '5G', 'доха'],
    ['sa', 'Саудовская Аравия', 'mideast', 520, '4G/5G', ''],
    ['om', 'Оман', 'mideast', 520, '4G', ''],
    ['bh', 'Бахрейн', 'mideast', 480, '4G', ''],
    ['kw', 'Кувейт', 'mideast', 480, '4G', ''],
    // Африка
    ['ma', 'Марокко', 'africa', 520, '4G', ''],
    ['tn', 'Тунис', 'africa', 480, '4G', ''],
    ['za', 'ЮАР', 'africa', 560, '4G', 'южная африка'],
    ['ke', 'Кения', 'africa', 560, '4G', ''],
    ['tz', 'Танзания', 'africa', 590, '4G', 'занзибар'],
    ['mu', 'Маврикий', 'africa', 620, '4G', ''],
    ['sc', 'Сейшелы', 'africa', 690, '4G', ''],
    // Америка
    ['us', 'США', 'america', 590, '4G/5G', 'америка нью-йорк'],
    ['ca', 'Канада', 'america', 620, '4G/5G', ''],
    ['mx', 'Мексика', 'america', 560, '4G', 'канкун'],
    ['br', 'Бразилия', 'america', 640, '4G', ''],
    ['ar', 'Аргентина', 'america', 620, '4G', ''],
    ['cl', 'Чили', 'america', 620, '4G', ''],
    ['pe', 'Перу', 'america', 620, '4G', ''],
    ['co', 'Колумбия', 'america', 620, '4G', ''],
    ['do', 'Доминикана', 'america', 640, '4G', 'доминиканская'],
    ['cu', 'Куба', 'america', 790, '4G', ''],
    ['cr', 'Коста-Рика', 'america', 640, '4G', ''],
    // Океания
    ['au', 'Австралия', 'oceania', 590, '4G/5G', 'сидней'],
    ['nz', 'Новая Зеландия', 'oceania', 620, '4G/5G', ''],
    // СНГ и Кавказ
    ['az', 'Азербайджан', 'cis', 430, '4G', 'баку'],
    ['kz', 'Казахстан', 'cis', 390, '4G', 'алматы астана'],
    ['uz', 'Узбекистан', 'cis', 390, '4G', 'ташкент самарканд'],
    ['kg', 'Киргизия', 'cis', 410, '4G', 'кыргызстан бишкек'],
    ['tj', 'Таджикистан', 'cis', 450, '4G', ''],
    ['by', 'Беларусь', 'cis', 390, '4G', 'белоруссия минск']
  ];

  var PARTS = [
    { id: 'europe', name: 'Европа' },
    { id: 'asia', name: 'Азия' },
    { id: 'mideast', name: 'Ближний Восток' },
    { id: 'cis', name: 'СНГ и Кавказ' },
    { id: 'africa', name: 'Африка' },
    { id: 'america', name: 'Америка' },
    { id: 'oceania', name: 'Океания' }
  ];

  // Региональные пакеты: одна eSIM на несколько стран
  var REGIONS = [
    { code: 'europe', name: 'Европа', price: 590, net: '4G/5G', photo: 'eu.jpg', flag: 'eu', place: 'Париж · 30+ стран',
      countries: ['fr', 'it', 'es', 'de', 'gb', 'gr', 'pt', 'nl', 'cz', 'at', 'ch', 'pl', 'hu', 'fi', 'no', 'se', 'dk', 'ie', 'be', 'hr', 'me', 'rs', 'cy', 'mt', 'is', 'ee', 'lv', 'lt', 'bg', 'ro', 'si', 'sk', 'tr'] },
    { code: 'asia', name: 'Азия', price: 690, net: '4G/5G', photo: 'asia.jpg', place: 'Таиланд, Вьетнам, Бали',
      countries: ['th', 'vn', 'id', 'my', 'sg', 'ph', 'jp', 'kr', 'cn', 'hk', 'tw', 'kh', 'in', 'lk'] },
    { code: 'mideast', name: 'Ближний Восток', price: 690, net: '4G/5G', photo: 'dubai.jpg', place: 'ОАЭ, Катар, Оман',
      countries: ['ae', 'qa', 'om', 'bh', 'kw', 'sa', 'jo', 'il', 'tr', 'eg'] },
    { code: 'america', name: 'Америка', price: 790, net: '4G/5G', photo: 'america.jpg', place: 'США, Канада, Мексика',
      countries: ['us', 'ca', 'mx', 'br', 'ar', 'cl', 'pe', 'co', 'cr'] },
    { code: 'world', name: 'Весь мир', price: 990, net: '4G', photo: 'world.jpg', place: '100+ стран в одной eSIM', countries: 'all' }
  ];

  // Фото: основное + галерея (файлы assets/photos/<код>.jpg и <код>-2.jpg, -3.jpg …)
  var PHOTOS = { tr: 5, ae: 4, th: 4, ge: 5, eg: 5, cn: 5, vn: 5, am: 3, gb: 4, us: 3, au: 4, nz: 4, fr: 3 };
  var PLACES_SHORT = {
    tr: 'Гёреме, Каппадокия', ae: 'Бурдж-Халифа, Дубай', th: 'Лодки-лонгтейлы, Краби', ge: 'Гергети, Казбеги',
    eg: 'Пирамиды Гизы', vn: 'Бухта Халонг', cn: 'Великая Китайская стена', am: 'Хор Вирап и Арарат',
    gb: 'Вестминстер, Лондон', us: 'Гранд-Каньон', au: 'Сиднейская опера', nz: 'Аораки, Южный остров', fr: 'Эйфелева башня, Париж'
  };
  var POPULAR = ['tr', 'ae', 'th', 'ge', 'eg', 'vn', 'cn', 'am'];

  // Родительный падеж для заголовков «eSIM для …»
  var GEN = {
    tr: 'Турции', ae: 'ОАЭ', th: 'Таиланда', ge: 'Грузии', eg: 'Египта', vn: 'Вьетнама', cn: 'Китая', am: 'Армении',
    fr: 'Франции', it: 'Италии', es: 'Испании', de: 'Германии', gb: 'Великобритании', gr: 'Греции', pt: 'Португалии',
    nl: 'Нидерландов', cz: 'Чехии', at: 'Австрии', ch: 'Швейцарии', pl: 'Польши', hu: 'Венгрии', fi: 'Финляндии',
    no: 'Норвегии', se: 'Швеции', dk: 'Дании', ie: 'Ирландии', be: 'Бельгии', hr: 'Хорватии', me: 'Черногории',
    rs: 'Сербии', cy: 'Кипра', mt: 'Мальты', is: 'Исландии', ee: 'Эстонии', lv: 'Латвии', lt: 'Литвы', bg: 'Болгарии',
    ro: 'Румынии', si: 'Словении', sk: 'Словакии', jp: 'Японии', kr: 'Южной Кореи', id: 'Индонезии', my: 'Малайзии',
    sg: 'Сингапура', ph: 'Филиппин', in: 'Индии', lk: 'Шри-Ланки', mv: 'Мальдив', hk: 'Гонконга', tw: 'Тайваня',
    kh: 'Камбоджи', np: 'Непала', mn: 'Монголии', il: 'Израиля', jo: 'Иордании', qa: 'Катара', sa: 'Саудовской Аравии',
    om: 'Омана', bh: 'Бахрейна', kw: 'Кувейта', ma: 'Марокко', tn: 'Туниса', za: 'ЮАР', ke: 'Кении', tz: 'Танзании',
    mu: 'Маврикия', sc: 'Сейшел', us: 'США', ca: 'Канады', mx: 'Мексики', br: 'Бразилии', ar: 'Аргентины', cl: 'Чили',
    pe: 'Перу', co: 'Колумбии', do: 'Доминиканы', cu: 'Кубы', cr: 'Коста-Рики', au: 'Австралии', nz: 'Новой Зеландии',
    az: 'Азербайджана', kz: 'Казахстана', uz: 'Узбекистана', kg: 'Киргизии', tj: 'Таджикистана', by: 'Беларуси',
    europe: 'Европы', asia: 'Азии', mideast: 'Ближнего Востока', america: 'Америки', world: 'всего мира'
  };

  var list = COUNTRIES.map(function (r) {
    return {
      code: r[0], name: r[1], gen: GEN[r[0]] || r[1], part: r[2], price: r[3], net: r[4], aliases: r[5] || '', type: 'country',
      photo: PHOTOS[r[0]] ? r[0] + '.jpg' : null,
      gallery: PHOTOS[r[0]] || 0,
      place: PLACES_SHORT[r[0]] || '',
      popular: POPULAR.indexOf(r[0]) !== -1
    };
  });
  REGIONS.forEach(function (r) {
    r.type = 'region';
    r.gen = GEN[r.code] || r.name;
    if (r.countries === 'all') r.countries = list.map(function (c) { return c.code; });
  });

  // Фото для стран без своего — фото региона
  var PART_PHOTO = { europe: 'eu.jpg', asia: 'asia.jpg', mideast: 'dubai.jpg', cis: 'kazbegi.jpg', africa: 'eg.jpg', america: 'america.jpg', oceania: 'au.jpg' };

  /* ---------- Тарифы ---------- */
  function round10(n) { return Math.ceil(n / 10) * 10; }

  // «На весь срок»: объём на всю поездку
  var FIXED = [
    { gb: 1, days: 7, k: 1 },
    { gb: 3, days: 15, k: 2.1 },
    { gb: 5, days: 30, k: 3, hit: true },
    { gb: 10, days: 30, k: 5 },
    { gb: 20, days: 30, k: 8.4 },
    { gb: 50, days: 90, k: 17 }
  ];
  // «С лимитом в день»: объём в сутки, срок выбирается
  var DAILY = [
    { gb: 1, k: 0.32 },
    { gb: 2, k: 0.5, hit: true },
    { gb: 3, k: 0.66 }
  ];

  function plansFor(dest) {
    var base = dest.price;
    return {
      fixed: FIXED.map(function (p) {
        return { id: 'f' + p.gb + '-' + p.days, kind: 'fixed', gb: p.gb, days: p.days, hit: !!p.hit, price: round10(base * p.k) };
      }),
      daily: DAILY.map(function (p) {
        return { id: 'd' + p.gb, kind: 'daily', gb: p.gb, hit: !!p.hit, perDay: round10(base * p.k) };
      })
    };
  }

  function findPlan(dest, id, days) {
    var pl = plansFor(dest);
    var i;
    for (i = 0; i < pl.fixed.length; i++) if (pl.fixed[i].id === id) return pl.fixed[i];
    for (i = 0; i < pl.daily.length; i++) {
      if (pl.daily[i].id === id) {
        var d = Math.min(30, Math.max(1, parseInt(days, 10) || 7));
        var p = pl.daily[i];
        return { id: p.id, kind: 'daily', gb: p.gb, days: d, perDay: p.perDay, price: p.perDay * d, hit: p.hit };
      }
    }
    return null;
  }

  /* ---------- Совместимость телефонов (предварительный список) ---------- */
  // s: y — поддерживает, n — нет, v — зависит от версии
  var DEVICES = {
    Apple: [
      ['iPhone 17, 17 Pro, 17 Pro Max, Air', 'y'], ['iPhone 16, 16e, 16 Plus, 16 Pro, 16 Pro Max', 'y'],
      ['iPhone 15, 15 Plus, 15 Pro, 15 Pro Max', 'y'], ['iPhone 14, 14 Plus, 14 Pro, 14 Pro Max', 'y'],
      ['iPhone 13, 13 mini, 13 Pro, 13 Pro Max', 'y'], ['iPhone 12, 12 mini, 12 Pro, 12 Pro Max', 'y'],
      ['iPhone 11, 11 Pro, 11 Pro Max', 'y'], ['iPhone SE (2020, 2022)', 'y'], ['iPhone XS, XS Max, XR', 'y'],
      ['iPhone X, 8, 8 Plus и старше', 'n'], ['iPad с Wi-Fi + Cellular (2018 и новее)', 'y']
    ],
    Samsung: [
      ['Galaxy S25, S25+, S25 Ultra', 'y'], ['Galaxy S24, S24+, S24 Ultra, S24 FE', 'y'], ['Galaxy S23, S23+, S23 Ultra, S23 FE', 'y'],
      ['Galaxy S22, S21, S20', 'y'], ['Galaxy Z Fold и Z Flip (все)', 'y'], ['Galaxy A55, A54, A35', 'v'],
      ['Galaxy A25, A15 и младше', 'n'], ['Galaxy Note 20', 'y']
    ],
    Google: [['Pixel 10, 9, 8, 7, 6 (все версии)', 'y'], ['Pixel 5, 4, 4a, 3, 3a', 'y'], ['Pixel 3a XL, Pixel 2 и старше', 'v']],
    Xiaomi: [['Xiaomi 15, 14, 13 (Pro, T Pro)', 'v'], ['Redmi Note 14 Pro, Redmi Note 13 Pro+', 'v'], ['Redmi Note 13, 12 и младше', 'n'], ['POCO (большинство моделей)', 'n']],
    'Другие': [
      ['Huawei P40, Huawei Mate 40 Pro', 'v'], ['Honor Magic 5 Pro, Honor Magic 6 Pro', 'v'], ['OnePlus 12, 13', 'v'], ['Motorola Razr 40, Motorola Edge 40', 'y'],
      ['Nothing Phone (3)', 'y'], ['OPPO Find X5, X8', 'v'], ['Vivo X90, X100 Pro', 'v'], ['Sony Xperia 1 IV и новее', 'y']
    ]
  };

  window.CATALOG = {
    countries: list,
    regions: REGIONS,
    parts: PARTS,
    popular: POPULAR,
    devices: DEVICES,
    plansFor: plansFor,
    findPlan: findPlan,
    get: function (code) {
      var i;
      for (i = 0; i < list.length; i++) if (list[i].code === code) return list[i];
      for (i = 0; i < REGIONS.length; i++) if (REGIONS[i].code === code) return REGIONS[i];
      return null;
    },
    photoOf: function (d) { return d.photo || PART_PHOTO[d.part] || 'world.jpg'; },
    all: function () { return list.concat(REGIONS); }
  };
})();

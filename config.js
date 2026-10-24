/*
  Настройки сайта. После правки пересоберите и опубликуйте:
    ./deploy/landing/publish-github.sh   (сборка запускается сама)
*/
window.SITE_CONFIG = {
  // Демо-режим кабинета: данные в браузере, письма и оплата имитируются (см. site-src/account.js).
  // false — кабинет, вход и оплата работают через API (нужен apiUrl ниже; адрес сайта — в SITE_URL/CORS_ORIGINS API)
  demo: false,

  // Адрес API (бэкенд с ботом). Когда задан — цены берутся с него, и сайт, бот и Mini App
  // всегда показывают одинаковые цены. Пусто — цены из снимка site-src/catalog.json.
  apiUrl: 'https://bot.privetsim.net',
  // Бот для кнопок «Купить в Telegram»: t.me/<бот>?start=c_TR
  telegramBot: 'PrivetSimBot',

  // Реквизиты продавца: строка в подвале, вкладка «Реквизиты» в документах, квитанции в кабинете.
  // Российский продавец — inn и ogrn; иностранный — reg (регистрационный номер). en — для английской версии
  seller: {
    name: 'Диджиталпэй ФЗЕ (Digitalpay FZE)',
    inn: '',
    ogrn: '',
    reg: '4309356',
    address: 'Бизнес-центр, Свободная экономическая зона Шарджа Паблишинг Сити, Шарджа, ОАЭ',
    en: { name: 'Digitalpay FZE', address: 'Business Centre, Sharjah Publishing City Free Zone, Sharjah, UAE' }
  }
};

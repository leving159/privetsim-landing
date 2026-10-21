/*
  Настройки сайта. После правки пересоберите и опубликуйте:
    ./deploy/landing/publish-github.sh   (сборка запускается сама)
*/
window.SITE_CONFIG = {
  // Демо-режим кабинета: данные в браузере, письма и оплата имитируются (см. site-src/account.js).
  // false — кабинет, вход и оплата работают через API (нужен apiUrl ниже; адрес сайта — в SITE_URL/CORS_ORIGINS API)
  demo: true,

  // Адрес API (бэкенд с ботом). Когда задан — цены берутся с него, и сайт, бот и Mini App
  // всегда показывают одинаковые цены. Пусто — цены из снимка site-src/catalog.json.
  apiUrl: '',      // 'https://api.privetsim.net'
  // Бот для кнопок «Купить в Telegram»: t.me/<бот>?start=c_TR
  telegramBot: 'PrivetSimBot',

  // Реквизиты продавца: строка в подвале и вкладка «Реквизиты» в документах
  seller: {
    name: '',    // 'ИП Иванов Иван Иванович'
    inn: '',
    ogrn: '',
    address: ''
  }
};

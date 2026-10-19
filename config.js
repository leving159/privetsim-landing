/*
  Настройки лендинга. Это единственный файл, который нужно править руками.
  После правки просто загрузите папку landing на сервер заново (см. docs/DEPLOY-LANDING.md).
*/
window.SITE_CONFIG = {
  // Адрес магазина (когда он будет запущен), без слэша в конце: 'https://shop.privetsim.ru'.
  // Пока пусто — кнопки «Купить» ведут в Telegram-бота (если он указан ниже).
  shopUrl: '',

  // Telegram без @, например 'privetsim_bot'. Пусто — кнопки бота/поддержки скрываются.
  botUsername: '',
  supportUsername: '',
  email: '', // например 'hello@privetsim.ru'

  // Документы (ссылки на страницы или PDF). Пусто — ссылка скрывается.
  offerUrl: '',
  privacyUrl: '',

  // Реквизиты продавца — по закону должны быть на сайте (ИП/ООО, ИНН, ОГРН).
  seller: '', // например: 'ИП Иванов Иван Иванович · ИНН 000000000000 · ОГРНИП 000000000000000'

  // Карточки направлений. price — «от … ₽» (минимальный пакет). photo — файл в assets/photos.
  // ВНИМАНИЕ: цены примерные — замените на свои актуальные.
  destinations: [
    { code: 'tr', name: 'Турция',  place: 'Каппадокия',        photo: 'tr.jpg', price: 390, net: '4G/5G', type: 'country' },
    { code: 'ae', name: 'ОАЭ',     place: 'Бурдж-Халифа, Дубай', photo: 'ae.jpg', price: 450, net: '5G',    type: 'country' },
    { code: 'th', name: 'Таиланд', place: 'Лодки-лонгтейлы',   photo: 'th.jpg', price: 350, net: '4G/5G', type: 'country' },
    { code: 'ge', name: 'Грузия',  place: 'Гергети, Казбеги',  photo: 'ge.jpg', price: 420, net: '4G',    type: 'country' },
    { code: 'eg', name: 'Египет',  place: 'Пирамиды Гизы',     photo: 'eg.jpg', price: 490, net: '4G',    type: 'country' },
    { code: 'vn', name: 'Вьетнам', place: 'Бухта Халонг',      photo: 'vn.jpg', price: 380, net: '4G',    type: 'country' },
    { code: 'cn', name: 'Китай',   place: 'Великая стена',     photo: 'cn.jpg', price: 520, net: '4G/5G', type: 'country' },
    { code: 'am', name: 'Армения', place: 'Хор Вирап',         photo: 'am.jpg', price: 410, net: '4G',    type: 'country' },
    // path — адрес страницы в магазине (по умолчанию countries/<code>)
    { code: 'eu',    name: 'Европа',   place: 'Париж · 30+ стран',     photo: 'eu.jpg',      price: 590, net: '4G/5G', type: 'region', path: 'regions/europe' },
    { code: 'asia',  name: 'Азия',     place: 'Таиланд, Вьетнам, Бали', photo: 'asia.jpg',    price: 690, net: '4G/5G', type: 'region', path: 'regions/asia' },
    { code: 'america', name: 'Америка', place: 'США, Канада, Мексика',  photo: 'america.jpg', price: 790, net: '4G/5G', type: 'region', path: 'regions/america' },
    { code: 'world', name: 'Весь мир', place: '100+ стран в одной eSIM', photo: 'world.jpg',  price: 990, net: '4G',    type: 'region', path: 'regions/world' }
  ],

  // Дополнительные страны для поиска (без фото). flag — файл в assets/flags, если есть.
  more: [
    { code: 'jp', name: 'Япония', price: 480 },
    { code: 'it', name: 'Италия', price: 450 },
    { code: 'es', name: 'Испания', price: 450 },
    { code: 'fr', name: 'Франция', price: 450 },
    { code: 'gb', name: 'Великобритания', price: 490 },
    { code: 'us', name: 'США', price: 590 },
    { code: 'cy', name: 'Кипр', price: 420 },
    { code: 'me', name: 'Черногория', price: 430 },
    { code: 'kz', name: 'Казахстан', price: 390 },
    { code: 'uz', name: 'Узбекистан', price: 390 },
    { code: 'id', name: 'Индонезия', aliases: 'бали', price: 420 },
    { code: 'lk', name: 'Шри-Ланка', price: 460 },
    { code: 'mv', name: 'Мальдивы', price: 690 },
    { code: 'in', name: 'Индия', price: 440 },
    { code: 'br', name: 'Бразилия', price: 640 },
    { code: 'au', name: 'Австралия', price: 590 },
    { code: 'nz', name: 'Новая Зеландия', price: 620 }
  ]
};

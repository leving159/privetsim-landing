/*
  Микро-анимации поверх макетов (см. motion.css). Подключается после runtime макетов.
  Ничего не перестраивает в разметке: только классы, CSS-переменные и оверлеи.
  Идеи: Magic UI (ripple, shine, blur fade, number ticker, confetti, scroll progress),
  Aceternity (animated tabs, card spotlight, placeholders), React Bits (click spark, magnet, glare),
  Eldora UI (live button, animated list).
*/
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var bootAt = 0;

  function onReady(fn) {
    var root = doc.getElementById('dc-root');
    if (root && root.children.length) return fn(root);
    var mo = new MutationObserver(function () {
      var r = doc.getElementById('dc-root');
      if (r && r.children.length) { mo.disconnect(); fn(r); }
    });
    mo.observe(doc.documentElement, { childList: true, subtree: true });
  }

  var SPOT = '.dest, .bento, .opt, .row, .bz-card, .rg-c, .more, .todo, .rev, .pk, .tr-opt';
  var PRESS = '.chip, .dest, .row, .more, .opt, .bz-tg, .em-chip, .dd-chip, .c-chip, .rg-c, .rg, .tr-opt, .pk';
  var SWAP = '.dest-grid, .pk-grid, .rg-grid';
  var SWAP_ITEMS = ['row', 'todo', 'rev', 'more', 'bz-card'];

  /* ---------- Привязка к элементам (повторяется после перерисовок React) ---------- */
  function scan(root) {
    root.querySelectorAll('.btn, .sh-btn').forEach(function (b) { b.classList.add('ps-rp'); });
    root.querySelectorAll('.btn-primary, .sh-pri').forEach(function (b) { b.classList.add('ps-shine'); });
    if (fine) root.querySelectorAll(SPOT).forEach(function (c) { c.classList.add('ps-spot'); });
    root.querySelectorAll(PRESS).forEach(function (c) { c.classList.add('ps-press'); });
    // Блик на карточке eSIM в панели покупки
    if (fine) root.querySelectorAll('aside .sticky > [aria-hidden="true"]').forEach(function (c) { c.classList.add('ps-spot', 'ps-spot-w'); });
    root.querySelectorAll('[role="tablist"], [role="radiogroup"]').forEach(initSeg);
    swapContainers(root).forEach(watchSwap);
    root.querySelectorAll('[data-ps-tick]').forEach(watchTick);
  }

  /* ---------- Волна от нажатия ---------- */
  doc.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.ps-rp');
    if (!b || reduce) return;
    var r = b.getBoundingClientRect();
    b.style.setProperty('--ps-rx', (e.clientX - r.left) + 'px');
    b.style.setProperty('--ps-ry', (e.clientY - r.top) + 'px');
    b.style.setProperty('--ps-rs', Math.max(r.width, r.height) * 2.4 + 'px');
    b.classList.remove('ps-rp-go');
    void b.offsetWidth;
    b.classList.add('ps-rp-go');
  }, { passive: true });

  /* ---------- Подсветка за курсором и магнит ---------- */
  if (fine) {
    doc.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.ps-spot');
      if (c) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--ps-mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--ps-my', (e.clientY - r.top) + 'px');
      }
      var m = e.target.closest && e.target.closest('.btn-primary.btn-lg, .btn-primary');
      if (m && !reduce) {
        var b = m.getBoundingClientRect();
        var dx = (e.clientX - (b.left + b.width / 2)) / (b.width / 2);
        var dy = (e.clientY - (b.top + b.height / 2)) / (b.height / 2);
        m.style.transition = 'translate .2s cubic-bezier(.2,.8,.2,1), ' + (m.style.transition || '');
        m.style.translate = (dx * 3).toFixed(1) + 'px ' + (dy * 2).toFixed(1) + 'px';
        m.__psMag = true;
      }
    }, { passive: true });
    doc.addEventListener('pointerout', function (e) {
      var m = e.target.closest && e.target.closest('.btn-primary');
      if (m && m.__psMag && !m.contains(e.relatedTarget)) { m.style.translate = ''; m.__psMag = false; }
    }, { passive: true });
  }

  /* ---------- Переключатели с плывущей подложкой ---------- */
  function bgOf(el) { return el.style.backgroundColor || el.style.background || ''; }
  function isOn(el) { return el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-checked') === 'true'; }
  function initSeg(list) {
    if (list.__psSeg) return;
    var items = Array.prototype.slice.call(list.querySelectorAll('[role="tab"], [role="radio"]'));
    if (items.length < 2 || items.length > 8) return;
    var sel = items.filter(isOn)[0];
    if (!sel) return;
    var selBg = bgOf(sel), other = items.filter(function (x) { return x !== sel; }).map(bgOf);
    // Только если выбранный пункт выделен фоном, а остальные — нет
    if (!selBg || other.some(function (b) { return b === selBg; })) return;
    if (items.some(function (x) { return Math.abs(x.offsetTop - items[0].offsetTop) > 4; })) return; // одна строка
    list.__psSeg = true;
    list.setAttribute('data-ps-seg', '');
    list.classList.add('ps-seg-init');
    var place = function () {
      var s = items.filter(isOn)[0];
      if (!s) return;
      list.style.setProperty('--ps-px', s.offsetLeft + 'px');
      list.style.setProperty('--ps-py', s.offsetTop + 'px');
      list.style.setProperty('--ps-pw', s.offsetWidth + 'px');
      list.style.setProperty('--ps-ph', s.offsetHeight + 'px');
      list.style.setProperty('--ps-pr', getComputedStyle(s).borderRadius);
      list.style.setProperty('--ps-pbg', bgOf(s));
      list.style.setProperty('--ps-psh', s.style.boxShadow || 'none');
    };
    place();
    requestAnimationFrame(function () { requestAnimationFrame(function () { list.classList.remove('ps-seg-init'); }); });
    new MutationObserver(function () {
      items = Array.prototype.slice.call(list.querySelectorAll('[role="tab"], [role="radio"]'));
      place();
    }).observe(list, { attributes: true, subtree: true, attributeFilter: ['aria-selected', 'aria-checked', 'style'] });
    window.addEventListener('resize', place);
  }

  /* ---------- Мягкая смена содержимого ---------- */
  function swapContainers(root) {
    var set = Array.prototype.slice.call(root.querySelectorAll(SWAP));
    SWAP_ITEMS.forEach(function (cls) {
      root.querySelectorAll('.' + cls).forEach(function (el) {
        if (el.parentElement && set.indexOf(el.parentElement) === -1) set.push(el.parentElement);
      });
    });
    root.querySelectorAll('ol').forEach(function (ol) { if (!ol.querySelector('.hs') && ol.children.length >= 3 && set.indexOf(ol) === -1) set.push(ol); });
    return set;
  }
  function animateIn(container) {
    var kids = Array.prototype.slice.call(container.children).filter(function (k) { return k.offsetParent !== null; }).slice(0, 16);
    kids.forEach(function (k, i) {
      k.classList.remove('ps-in');
      void k.offsetWidth;
      k.style.setProperty('--ps-d', i * 28 + 'ms');
      k.classList.add('ps-in');
      k.addEventListener('animationend', function done(ev) {
        if (ev.animationName !== 'ps-in') return;
        k.classList.remove('ps-in');
        k.removeEventListener('animationend', done);
      });
    });
  }
  function watchSwap(c) {
    if (c.__psSwap || reduce) return;
    c.__psSwap = true;
    var t;
    new MutationObserver(function () {
      if (Date.now() - bootAt < 1200) return;
      clearTimeout(t);
      t = setTimeout(function () { animateIn(c); }, 40);
    }).observe(c, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  }

  /* ---------- Цена «Итого» ---------- */
  function watchTick(el) {
    if (el.__psTick || reduce) return;
    el.__psTick = true;
    var last = el.textContent;
    new MutationObserver(function () {
      if (el.textContent === last) return;
      last = el.textContent;
      el.classList.remove('ps-tick');
      void el.offsetWidth;
      el.classList.add('ps-tick');
    }).observe(el, { childList: true, characterData: true, subtree: true });
  }

  /* ---------- Искры при выборе тарифа (click spark) ---------- */
  var sparkCv, sparkCtx, sparks = [], sparkRaf;
  function spark(x, y) {
    if (reduce) return;
    if (!sparkCv) {
      sparkCv = doc.createElement('canvas');
      sparkCv.className = 'ps-confetti';
      doc.body.appendChild(sparkCv);
      sparkCtx = sparkCv.getContext('2d');
    }
    var dpr = window.devicePixelRatio || 1;
    sparkCv.width = innerWidth * dpr; sparkCv.height = innerHeight * dpr;
    sparkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (var i = 0; i < 8; i++) sparks.push({ x: x, y: y, a: i / 8 * Math.PI * 2, t: 0, c: i % 2 ? '#FF7A45' : '#2F5BFF' });
    if (!sparkRaf) sparkRaf = requestAnimationFrame(drawSparks);
  }
  function drawSparks() {
    sparkCtx.clearRect(0, 0, innerWidth, innerHeight);
    sparks = sparks.filter(function (s) { return s.t < 1; });
    sparks.forEach(function (s) {
      s.t += 0.06;
      var e = 1 - Math.pow(1 - s.t, 3), r0 = 6 + e * 16, r1 = r0 + 7 * (1 - s.t);
      sparkCtx.strokeStyle = s.c; sparkCtx.lineWidth = 2; sparkCtx.lineCap = 'round'; sparkCtx.globalAlpha = 1 - s.t;
      sparkCtx.beginPath();
      sparkCtx.moveTo(s.x + Math.cos(s.a) * r0, s.y + Math.sin(s.a) * r0);
      sparkCtx.lineTo(s.x + Math.cos(s.a) * r1, s.y + Math.sin(s.a) * r1);
      sparkCtx.stroke();
    });
    sparkCtx.globalAlpha = 1;
    sparkRaf = sparks.length ? requestAnimationFrame(drawSparks) : 0;
  }
  doc.addEventListener('click', function (e) {
    var p = e.target.closest && e.target.closest('.pk');
    if (p && p.getAttribute('aria-checked') !== 'true') spark(e.clientX, e.clientY);
  });

  /* ---------- Конфетти: «eSIM готова» ---------- */
  function confetti() {
    if (reduce) return;
    var cv = doc.createElement('canvas'), ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1;
    cv.className = 'ps-confetti';
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    doc.body.appendChild(cv);
    var C = ['#2F5BFF', '#5A7DFF', '#FF7A45', '#0E1220', '#E6ECFF'], parts = [];
    for (var i = 0; i < 110; i++) {
      var left = i % 2 === 0;
      parts.push({ x: left ? -10 : innerWidth + 10, y: innerHeight * (0.35 + Math.random() * 0.3), vx: (left ? 1 : -1) * (5 + Math.random() * 7), vy: -(6 + Math.random() * 8), r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, w: 6 + Math.random() * 5, h: 3 + Math.random() * 4, c: C[i % C.length] });
    }
    var start = performance.now();
    (function frame(now) {
      var t = (now - start) / 1000;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach(function (p) {
        p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 1.6) / 0.8);
        ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      if (t < 2.4) requestAnimationFrame(frame); else cv.remove();
    })(start);
  }

  /* ---------- Прогресс чтения ---------- */
  function progress() {
    if (reduce || doc.documentElement.scrollHeight < innerHeight * 2.6) return;
    var bar = doc.createElement('div');
    bar.className = 'ps-progress';
    doc.body.appendChild(bar);
    var raf = 0;
    var upd = function () {
      raf = 0;
      var max = doc.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty('--ps-p', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
    };
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    upd();
  }

  /* ---------- «Печатающийся» плейсхолдер поиска ---------- */
  function typePlaceholder(input) {
    if (reduce || input.__psType) return;
    input.__psType = true;
    var base = input.getAttribute('placeholder') || '';
    var m = base.match(/^(.*Например,\s)/);
    if (!m) return;
    var prefix = m[1], words = ['Турция', 'Таиланд', 'Грузия', 'ОАЭ', 'Европа', 'Япония'], wi = 0, ci = words[0].length, dir = -1, timer;
    var tick = function () {
      if (doc.activeElement === input || input.value) { input.setAttribute('placeholder', base); timer = setTimeout(tick, 1200); return; }
      var w = words[wi];
      ci += dir;
      if (ci < 0) { wi = (wi + 1) % words.length; dir = 1; ci = 0; w = words[wi]; }
      input.setAttribute('placeholder', prefix + w.slice(0, ci) + (dir > 0 || ci < w.length ? '|' : ''));
      var delay = dir > 0 ? 90 : 45;
      if (dir > 0 && ci >= w.length) { dir = -1; delay = 1800; input.setAttribute('placeholder', prefix + w); }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 2200);
  }

  onReady(function (root) {
    bootAt = Date.now();
    scan(root);
    var t;
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { scan(root); }, 80); })
      .observe(root, { childList: true, subtree: true });
    setTimeout(progress, 600);
    root.querySelectorAll('input[type="search"]').forEach(typePlaceholder);
    if (/order\.html$/.test(location.pathname)) setTimeout(confetti, 450);
  });
})();

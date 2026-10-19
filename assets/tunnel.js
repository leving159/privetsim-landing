/*
  «Полетели?» — тоннель из фото направлений на главной.
  Идея — Passage Gallery (React Bits Pro); реализация своя: CSS 3D + JS, без WebGL и зависимостей.

  • камера медленно летит вперёд, взгляд следует за курсором;
  • зажали кнопку мыши/палец на пустом месте — ускорение;
  • наведение подсвечивает фото, клик — фото вылетает вперёд, затем открывается страница страны;
  • вне экрана и в фоновой вкладке анимация стоит; при «уменьшить движение» — статичный вид.

  Данные (фото → страна, подписи) — window.PS_TUNNEL (собирается в tools/build-site.mjs).
*/
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mount(stage) {
    if (stage.__psTunnel) return;
    stage.__psTunnel = true;
    var DATA = (window.PS_TUNNEL || []).slice();
    if (!DATA.length) return;

    var N = 12;            // колец в глубину
    var LANES = 4;         // плиток поперёк пола и потолка
    var GAP = 0.1;         // зазор между плитками (доля клетки)
    var FILL = 0.32;       // доля клеток с фото
    var ACCENT = 0.06;     // доля клеток-акцентов
    var SPEED = 0.55;      // клеток в секунду
    var BOOST = 7;

    var view = doc.createElement('div');
    view.className = 'pt-view';
    var world = doc.createElement('div');
    world.className = 'pt-world';
    view.appendChild(world);
    stage.appendChild(view);

    var glow = doc.createElement('div');
    glow.className = 'pt-glow';
    stage.appendChild(glow);

    var W, H, cell, cellV, lanesV, P, tiles = [], planes = [];
    var cz = 0, speed = reduce ? 0 : SPEED, target = speed, rx = 0, ry = 0, trx = 0, try_ = 0;
    var seed = 7;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var next = 0;
    var pickPhoto = function () { var d = DATA[next % DATA.length]; next++; return d; };

    function layout() {
      W = stage.clientWidth; H = stage.clientHeight;
      cell = W / LANES;
      lanesV = Math.max(2, Math.round(H / cell));
      cellV = H / lanesV;
      P = (H / 2) / Math.tan(36 * Math.PI / 180);
      view.style.perspective = P + 'px';
    }

    // Стены: пол, потолок, лево, право. Для каждой — сколько дорожек и как повернуть плитку
    function slotTransform(wall, lane, zw) {
      var x, y, rot, w, h;
      var g = 1 - GAP;
      if (wall === 0 || wall === 1) { // пол / потолок
        x = -W / 2 + (lane + 0.5) * cell; y = wall === 0 ? H / 2 : -H / 2;
        rot = wall === 0 ? 'rotateX(90deg)' : 'rotateX(-90deg)'; w = cell * g; h = cell * g;
      } else { // лево / право
        x = wall === 2 ? -W / 2 : W / 2; y = -H / 2 + (lane + 0.5) * cellV;
        rot = wall === 2 ? 'rotateY(90deg)' : 'rotateY(-90deg)'; w = cell * g; h = cellV * g;
      }
      return { t: 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + (-zw).toFixed(1) + 'px) ' + rot, w: w, h: h };
    }

    function build() {
      world.innerHTML = '';
      tiles = []; planes = [];
      layout();
      // Сетка: 4 длинные плоскости с линиями
      for (var p = 0; p < 4; p++) {
        var pl = doc.createElement('div');
        pl.className = 'pt-plane';
        world.appendChild(pl);
        planes.push(pl);
      }
      for (var r = 0; r < N; r++) {
        for (var wall = 0; wall < 4; wall++) {
          var lanes = wall < 2 ? LANES : lanesV;
          for (var lane = 0; lane < lanes; lane++) {
            var v = rnd();
            if (v > FILL + ACCENT) continue;
            var t = { wall: wall, lane: lane, zw: (r + 1) * cell, accent: v > FILL, el: null };
            t.el = doc.createElement(t.accent ? 'span' : 'a');
            t.el.className = t.accent ? 'pt-tile pt-accent' : 'pt-tile';
            if (!t.accent) {
              t.el.setAttribute('tabindex', '-1');
              t.el.setAttribute('aria-hidden', 'true');
              t.el.appendChild(doc.createElement('img'));
              assign(t);
            }
            world.appendChild(t.el);
            tiles.push(t);
          }
        }
      }
      tiles.forEach(place);
    }

    function assign(t) {
      var d = pickPhoto();
      t.d = d;
      var img = t.el.firstChild;
      img.alt = '';
      img.decoding = 'async';
      img.src = 'assets/photos/t/' + d.id + '.jpg';
      t.el.href = d.href;
    }

    function place(t) {
      var s = slotTransform(t.wall, t.lane, t.zw);
      t.el.style.width = s.w + 'px';
      t.el.style.height = s.h + 'px';
      t.el.style.marginLeft = -s.w / 2 + 'px';
      t.el.style.marginTop = -s.h / 2 + 'px';
      t.el.style.transform = s.t;
    }

    function placePlanes() {
      var L = (N + 1) * cell;
      var base = Math.floor(cz / cell) * cell; // сетка повторяется каждую клетку
      var zc = base + L / 2 - cell;
      var defs = [
        { w: W, h: L, t: 'translate3d(0,' + H / 2 + 'px,' + (-zc) + 'px) rotateX(90deg)', bg: [cell, cell] },
        { w: W, h: L, t: 'translate3d(0,' + (-H / 2) + 'px,' + (-zc) + 'px) rotateX(-90deg)', bg: [cell, cell] },
        { w: L, h: H, t: 'translate3d(' + (-W / 2) + 'px,0,' + (-zc) + 'px) rotateY(90deg)', bg: [cell, cellV] },
        { w: L, h: H, t: 'translate3d(' + (W / 2) + 'px,0,' + (-zc) + 'px) rotateY(-90deg)', bg: [cell, cellV] }
      ];
      planes.forEach(function (pl, i) {
        var d = defs[i];
        pl.style.width = d.w + 'px'; pl.style.height = d.h + 'px';
        pl.style.marginLeft = -d.w / 2 + 'px'; pl.style.marginTop = -d.h / 2 + 'px';
        pl.style.transform = d.t;
        pl.style.backgroundSize = d.bg[0] + 'px ' + d.bg[1] + 'px';
        pl.style.setProperty('--pt-dir', ['to top', 'to bottom', 'to right', 'to left'][i]); // дальний край — прозрачный
      });
    }

    // Туман: чем дальше, тем прозрачнее; вблизи — плавное исчезновение за камерой
    function fog(t) {
      var d = t.zw - cz, far = N * cell;
      var o = Math.min(1, Math.max(0, d / (cell * 0.6))) * Math.max(0, 1 - Math.pow(d / far, 1.6));
      t.el.style.opacity = o.toFixed(3);
    }

    var last = 0, raf = 0, visible = false;
    function frame(now) {
      raf = 0;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      speed += (target - speed) * Math.min(1, dt * 4);
      cz += speed * cell * dt;
      // Переносим «пройденные» плитки в конец тоннеля
      for (var i = 0; i < tiles.length; i++) {
        var t = tiles[i];
        if (t.zw - cz < -cell * 0.2) {
          t.zw += N * cell;
          if (!t.accent && t !== focused) assign(t);
          place(t);
        }
        fog(t);
      }
      // Обнуляем координаты, чтобы числа не росли бесконечно
      if (cz > N * cell * 4) {
        var shift = N * cell * 3;
        cz -= shift;
        tiles.forEach(function (t) { t.zw -= shift; place(t); });
      }
      rx += (trx - rx) * Math.min(1, dt * 5);
      ry += (try_ - ry) * Math.min(1, dt * 5);
      world.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(' + cz.toFixed(1) + 'px)';
      placePlanes();
      if (visible && !doc.hidden) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && visible) { last = 0; raf = requestAnimationFrame(frame); } }

    /* ---------- Взаимодействие ---------- */
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      try_ = nx * 10; trx = -ny * 7;
    });
    stage.addEventListener('pointerleave', function () { trx = 0; try_ = 0; if (!reduce) target = SPEED; });
    stage.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.pt-tile:not(.pt-accent)') || reduce) return;
      target = SPEED * BOOST;
      stage.classList.add('pt-boost');
    });
    var release = function () { if (!reduce) target = SPEED; stage.classList.remove('pt-boost'); };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);

    // Клик по фото: вылетает вперёд с подписью, затем открывается страна
    var focused = null, overlay = null, goTimer = 0;
    stage.addEventListener('click', function (e) {
      var a = e.target.closest('.pt-tile:not(.pt-accent)');
      if (!a) return;
      e.preventDefault();
      var t = tiles.filter(function (x) { return x.el === a; })[0];
      if (t) openTile(t);
    });

    function openTile(t) {
      if (overlay) return;
      focused = t;
      var from = t.el.getBoundingClientRect();
      var big = Math.min(innerWidth - 32, 720), bh = big * 0.75;
      if (bh > innerHeight - 160) { bh = innerHeight - 160; big = bh / 0.75; }
      overlay = doc.createElement('div');
      overlay.className = 'pt-focus';
      overlay.innerHTML =
        '<div class="pt-focus-bg"></div>' +
        '<figure class="pt-card"><img alt="" src="assets/photos/' + t.d.id + '.jpg">' +
        '<figcaption><span class="pt-cap"></span><b class="pt-name"></b><span class="pt-go"></span></figcaption></figure>';
      overlay.querySelector('.pt-cap').textContent = t.d.cap;
      overlay.querySelector('.pt-name').textContent = 'eSIM · ' + t.d.name;
      overlay.querySelector('.pt-go').textContent = 'от ' + t.d.price + ' ₽ · открываем…';
      doc.body.appendChild(overlay);
      var card = overlay.querySelector('.pt-card');
      card.style.width = big + 'px'; card.style.height = bh + 'px';
      card.style.left = (innerWidth - big) / 2 + 'px'; card.style.top = (innerHeight - bh) / 2 + 'px';
      t.el.style.visibility = 'hidden';
      var sx = from.width / big, sy = from.height / bh;
      var dx = from.left - (innerWidth - big) / 2, dy = from.top - (innerHeight - bh) / 2;
      var anim = card.animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')', borderRadius: '10px' },
        { transform: 'none', borderRadius: '24px' }
      ], { duration: reduce ? 1 : 520, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
      overlay.classList.add('pt-on');
      anim.onfinish = function () {
        overlay.classList.add('pt-cap-on');
        goTimer = setTimeout(function () { location.href = t.d.href; }, 900);
      };
      overlay.addEventListener('click', function () { clearTimeout(goTimer); location.href = t.d.href; });
    }
    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !overlay) return;
      clearTimeout(goTimer);
      overlay.remove(); overlay = null;
      if (focused) focused.el.style.visibility = '';
      focused = null;
    });
    // Вернулись назад из страны (bfcache) — убрать открытое фото
    window.addEventListener('pageshow', function () {
      if (!overlay) return;
      overlay.remove(); overlay = null;
      if (focused) focused.el.style.visibility = '';
      focused = null;
    });

    /* ---------- Жизненный цикл ---------- */
    // Фото грузим, только когда блок рядом с экраном
    var built = false;
    var init = function () {
      if (built) return;
      built = true;
      build();
      placePlanes();
      tiles.forEach(fog);
      world.style.transform = 'translateZ(0px)';
      if (reduce) { visible = true; frame(performance.now()); visible = false; }
    };
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) init();
    }, { rootMargin: '600px' }).observe(stage);
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      stage.classList.toggle('pt-live', visible);
      if (visible && built) start();
    }, { rootMargin: '120px' }).observe(stage);
    doc.addEventListener('visibilitychange', start);
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { var w = stage.clientWidth; if (built && Math.abs(w - W) > 2) { seed = 7; next = 0; build(); placePlanes(); tiles.forEach(fog); } }, 150);
    });
  }

  function find() {
    var s = doc.querySelector('[data-pt-stage]');
    if (s) mount(s);
  }
  var mo = new MutationObserver(find);
  mo.observe(doc.documentElement, { childList: true, subtree: true });
  find();
})();

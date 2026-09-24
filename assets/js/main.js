/* ==========================================================================
   婚礼请帖 · 互动 + 动画
   资料一律来自 assets/js/config.js，这个档案不需要改。

   动画用 GSAP（core / ScrollTrigger / ScrollSmoother / SplitText / DrawSVG）。
   GSAP 由 index.html 的 <head> 载入；载入成功时 <html> 会带上 .gsap，
   CSS 才会先把要进场的元素藏起来。CDN 挂掉就没有 .gsap，
   整页维持静态可读版本，不会有东西消失。
   ========================================================================== */
(function () {
  'use strict';

  var C = window.CONFIG;
  if (!C) { console.error('config.js 没有载入'); return; }

  var root = document.documentElement;
  var hasGSAP = root.classList.contains('gsap');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* GSAP 初始化若中途出错，就把 .gsap 拿掉，让 CSS 把所有元素还原成可见。
     宁可没有动画，也不能有看不见的内容。 */
  function bailOutOfAnimation(err) {
    if (err) console.warn('动画初始化失败，改用静态版：', err);
    root.classList.remove('gsap');
  }
  setTimeout(function () {
    if (!root.dataset.animReady) bailOutOfAnimation();
  }, 3000);


  /* --- 1. 把 config 的资料接上页面 -------------------------------------- */
  function waLink(text) {
    return 'https://wa.me/' + C.contact.whatsapp +
           (text ? '?text=' + encodeURIComponent(text) : '');
  }

  var mapLink = $('#mapLink');
  if (mapLink) mapLink.href = C.venue.mapUrl;

  var deadlineEl = $('#rsvpDeadline');
  if (deadlineEl) deadlineEl.textContent = C.rsvp.deadlineLabel;

  var lbCountEl = $('#lbCount');
  if (lbCountEl) lbCountEl.textContent = '1 / ' + C.photos.length;


  /* --- 2. 倒数计时 ------------------------------------------------------ */
  (function countdown() {
    var box  = $('#countdown');
    var lead = $('#countdownLead');
    if (!box) return;

    var start = new Date(C.weddingDateTime).getTime();
    var end   = new Date(C.weddingEndDateTime).getTime();
    if (isNaN(start)) { box.remove(); if (lead) lead.remove(); return; }

    var units = [
      { k: 'days',  lbl: '天' },
      { k: 'hours', lbl: '时' },
      { k: 'mins',  lbl: '分' },
      { k: 'secs',  lbl: '秒' }
    ];

    box.innerHTML = units.map(function (u) {
      return '<div class="countdown__cell">' +
               '<span class="countdown__num" data-u="' + u.k + '">--</span>' +
               '<span class="countdown__lbl">' + u.lbl + '</span>' +
             '</div>';
    }).join('');

    var cells = {};
    units.forEach(function (u) { cells[u.k] = $('[data-u="' + u.k + '"]', box); });

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function tick() {
      var now = Date.now();

      if (now >= end) {
        box.className = 'countdown countdown--day';
        box.textContent = '20 · 12 · 2026 · 礼成';
        if (lead) lead.style.display = 'none';
        clearInterval(timer);
        return;
      }
      if (now >= start) {
        box.className = 'countdown countdown--day';
        box.textContent = '今天，我们结婚 🤍';
        if (lead) lead.style.display = 'none';
        return;
      }

      var d = start - now;
      cells.days.textContent  = Math.floor(d / 864e5);
      cells.hours.textContent = pad(Math.floor(d / 36e5) % 24);
      cells.mins.textContent  = pad(Math.floor(d / 6e4) % 60);
      cells.secs.textContent  = pad(Math.floor(d / 1e3) % 60);
    }

    tick();
    var timer = setInterval(tick, 1000);
  })();


  /* --- 3. 内文照片即放大钮 ------------------------------------------------
     以前另开一段相册宫格，现在照片就在故事里，点哪张开哪张。
     data-photo 对应 config.photos 的 id；找不到就当普通图，不挂事件。 */
  (function photoButtons() {
    var order = C.photos.map(function (ph) { return ph.id; });

    $$('.figure__btn').forEach(function (btn) {
      var i = order.indexOf(btn.dataset.photo);
      if (i < 0) { btn.disabled = true; return; }
      var alt = C.photos[i].alt;
      btn.setAttribute('aria-label', '放大照片：' + alt);
      btn.addEventListener('click', function () { openLb(i, btn); });
    });
  })();


  /* --- 3b. 页内锚点（Hero 的「确认出席 RSVP」） ---------------------------
     ScrollSmoother 把内容整块位移了，浏览器自己的锚点跳转会跳到错的位置，
     所以自己接手。没有 smoother 时就走原生 scrollIntoView。 */
  $$('[data-scroll-to]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (smoother) smoother.scrollTo(target, true, 'top top');
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });


  /* --- 4. 大图检视 ------------------------------------------------------- */
  var smoother = null;                 /* ScrollSmoother 实例，开灯箱时要暂停 */

  var lb = {
    el: $('#lightbox'), img: $('#lbImg'), count: $('#lbCount'),
    i: 0, opener: null
  };

  function show(i) {
    var n = C.photos.length;
    lb.i = (i + n) % n;
    var ph = C.photos[lb.i];
    lb.img.classList.remove('is-shown');
    var next = new Image();
    next.onload = function () {
      lb.img.src = next.src;
      lb.img.alt = ph.alt;
      void lb.img.offsetWidth;          /* 强制重排，不靠 rAF（背景分页会被节流） */
      lb.img.classList.add('is-shown');
    };
    next.src = 'assets/img/' + ph.id + '.jpg';
    lb.count.textContent = (lb.i + 1) + ' / ' + n;
    /* 先把前后两张预载，翻页才不会卡 */
    [lb.i + 1, lb.i - 1].forEach(function (j) {
      var pre = new Image();
      pre.src = 'assets/img/' + C.photos[(j + n) % n].id + '.jpg';
    });
  }

  function openLb(i, opener) {
    if (!lb.el) return;
    lb.opener = opener || null;
    lb.el.hidden = false;
    void lb.el.offsetWidth;
    lb.el.classList.add('is-open');
    /* 有 ScrollSmoother 时不能用 body overflow 锁页 —— 它不是卷动容器，
       锁了反而会让页高塌掉、关掉灯箱位置就跑了。直接暂停 smoother。 */
    if (smoother) smoother.paused(true);
    else document.body.classList.add('is-locked');
    show(i);
    $('#lbClose').focus();
  }

  function closeLb() {
    lb.el.classList.remove('is-open');
    if (smoother) smoother.paused(false);
    else document.body.classList.remove('is-locked');
    setTimeout(function () { lb.el.hidden = true; lb.img.src = ''; }, 450);
    if (lb.opener) lb.opener.focus();
  }

  if (lb.el) {
    $('#lbClose').addEventListener('click', closeLb);
    $('#lbPrev').addEventListener('click', function () { show(lb.i - 1); });
    $('#lbNext').addEventListener('click', function () { show(lb.i + 1); });
    lb.el.addEventListener('click', function (e) {
      if (e.target === lb.el || e.target.classList.contains('lightbox__stage')) closeLb();
    });

    document.addEventListener('keydown', function (e) {
      if (lb.el.hidden) return;
      if (e.key === 'Escape')     closeLb();
      if (e.key === 'ArrowLeft')  show(lb.i - 1);
      if (e.key === 'ArrowRight') show(lb.i + 1);
      if (e.key === 'Tab') {
        /* 开着灯箱时，焦点不要跑到底下的页面去 */
        var f = $$('button', lb.el);
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    /* 手机滑动翻页 */
    var x0 = null, y0 = null;
    lb.el.addEventListener('touchstart', function (e) {
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    lb.el.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(lb.i + (dx < 0 ? 1 : -1));
      x0 = y0 = null;
    }, { passive: true });
  }


  /* --- 5. RSVP 表单 ------------------------------------------------------ */
  (function rsvp() {
    var form = $('#rsvpForm');
    if (!form) return;

    var cond     = $('#attendingOnly');
    var status   = $('#formStatus');
    var fallback = $('#formFallback');
    var waBtn    = $('#waFallback');
    var btn      = $('#submitBtn');
    var thanks   = $('#thanks');

    /* 选「出席」才展开人数与忌口 */
    $$('input[name="attending"]', form).forEach(function (r) {
      r.addEventListener('change', function () {
        cond.classList.toggle('is-open', r.value === '会出席' && r.checked);
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });

    function read() {
      var fd = new FormData(form);
      return {
        name:      (fd.get('name')      || '').trim(),
        attending: fd.get('attending')  || '',
        guests:    fd.get('attending') === '会出席' ? (fd.get('guests') || '1') : '-',
        diet:      fd.get('attending') === '会出席' ? (fd.get('diet')   || '没有特别忌口') : '-',
        phone:     (fd.get('phone')     || '').trim(),
        message:   (fd.get('message')   || '').trim(),
        trap:      (fd.get('website')   || '').trim()
      };
    }

    function waText(d) {
      return '【伟彬 & 美雯 Wedding RSVP 💍】\n' +
             '姓名：' + d.name + '\n' +
             '出席：' + d.attending + '\n' +
             (d.attending === '会出席'
               ? '人数：' + d.guests + '\n饮食需求：' + d.diet + '\n'
               : '') +
             '联络号码：' + d.phone +
             (d.message ? '\n留言：' + d.message : '');
    }

    function say(msg, tone) {
      /* 文案里有 <br>，所以用 innerHTML；这里的字串都是写死的，不吃用户输入 */
      status.innerHTML = msg;
      status.setAttribute('data-tone', tone || '');
    }

    function invalid(d) {
      if (!d.name)      return '还差你的名字哦。';
      if (!d.attending) return '请告诉我们你当天能不能来。';
      if (!d.phone)     return '请留下联络号码，方便我们确认。';
      return null;
    }

    function succeed(d) {
      var coming = d.attending === '会出席';
      form.style.display = 'none';
      $('#thanksTitle').textContent = coming ? 'Yay，我们婚礼见！💍' : '收到啦 🤍';
      $('#thanksBody').innerHTML = coming
        ? '你的 RSVP 收到啦。<br>到时候记得来找我们拍张照！'
        : '这次虽然没办法一起庆祝，<br>没关系，我们之后再聚。';
      $('#thanksLine').textContent = coming ? '12月20日见 🤍' : '下次见！';
      thanks.classList.add('is-shown');
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      if (smoother) smoother.scrollTo(thanks, true, 'center center');
      else thanks.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }

    function offerWhatsApp(d, msg) {
      waBtn.href = waLink(waText(d));
      fallback.classList.add('is-shown');
      say(msg, 'err');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = read();

      if (d.trap) return;                       /* 机器人填的，静静丢掉 */

      var bad = invalid(d);
      if (bad) { say(bad, 'err'); return; }

      /* 还没接上 Google Sheet 的话，直接走 WhatsApp，不让回覆掉在半路 */
      if (!C.rsvp.endpoint) {
        offerWhatsApp(d, '好像暂时送不出去。<br>没关系，可以直接用下面的 WhatsApp 按钮把 RSVP 发给我们。');
        return;
      }

      btn.disabled = true;
      say('正在送出 RSVP…', '');
      fallback.classList.remove('is-shown');

      var ctrl = new AbortController();
      var giveUp = setTimeout(function () { ctrl.abort(); }, 12000);

      fetch(C.rsvp.endpoint, {
        method: 'POST',
        /* text/plain 可以避开 CORS 预检，Apps Script 不回应 OPTIONS */
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(d),
        redirect: 'follow',
        signal: ctrl.signal
      })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function () {
        clearTimeout(giveUp);
        succeed(d);
      })
      .catch(function (err) {
        clearTimeout(giveUp);
        console.warn('RSVP 送出失败：', err);
        btn.disabled = false;
        offerWhatsApp(d, 'Oops，好像没有成功送出。<br>可以点下面的 WhatsApp 按钮直接回覆我们，一样算数 🤍');
      });
    });
  })();


  /* ======================================================================
     6. 动画 · GSAP
     ====================================================================== */
  if (!hasGSAP) return;

  try {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, DrawSVGPlugin);
  } catch (err) {
    bailOutOfAnimation(err);
    return;
  }

  /* 元素已经交给 GSAP 管，先标记成功，失效计时器就不会把 .gsap 拿掉 */
  root.dataset.animReady = '1';

  gsap.defaults({ ease: 'power3.out', duration: 1 });

  /* SplitText 要等字体真的下载完才切行，不然行数会算错 */
  var fontsReady = (document.fonts && document.fonts.ready)
    ? document.fonts.ready
    : Promise.resolve();

  /* 页面里的图片会陆续载入、把页面撑长，位置要重算。
     lazy 图是边卷边载的，只在 window.load 重算一次不够：
     ScrollSmoother 会拿着旧的页高走，卷到底就会多出一段空白。
     所以每张图载完都排一次重算，用 debounce 合并成一次。 */
  var refreshTimer = null;
  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { ScrollTrigger.refresh(); }, 180);
  }
  window.addEventListener('load', scheduleRefresh);
  $$('img').forEach(function (img) {
    if (img.complete) return;
    img.addEventListener('load',  scheduleRefresh, { once: true });
    img.addEventListener('error', scheduleRefresh, { once: true });
  });

  var mm = gsap.matchMedia();

  /* ---- 6a. 想要少一点动态的人：直接把所有东西设成最终状态 ---- */
  mm.add('(prefers-reduced-motion: reduce)', function () {
    gsap.set('.reveal, .hero__inner', { opacity: 1, y: 0, clearProps: 'transform' });
    gsap.set('.reveal-img', { clipPath: 'inset(0% 0% 0% 0%)' });
    gsap.set('.xi-mark', { opacity: 1, scale: 1 });
    gsap.set('#threadPath', { drawSVG: '0% 100%' });
    gsap.set('#knotPath', { drawSVG: '0% 100%' });
  });

  /* ---- 6b. 一般情况 ---- */
  mm.add('(prefers-reduced-motion: no-preference)', function () {

    /* 平滑卷动只在有滑鼠、够宽的装置上开；手机维持原生卷动最顺 */
    if (window.matchMedia('(min-width: 48em) and (pointer: fine)').matches) {
      smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: 1.05,
        effects: false,
        normalizeScroll: false,
        ignoreMobileResize: true
      });
    }

    var splits = [];

    /* --- Hero：图片先缓缓推近，名字一个字一个字升起来 ----------------- */
    var heroNames = $('.hero__names');
    var heroChars = null;
    if (heroNames) {
      var s = SplitText.create(heroNames, { type: 'chars,words', mask: 'chars', aria: 'auto' });
      splits.push(s);
      heroChars = s.chars;
    }

    var heroTl = gsap.timeline({ delay: 0.15 });
    heroTl
      .set('.hero__inner', { opacity: 1 })
      .from('.hero__media img', { scale: 1.16, duration: 2.4, ease: 'power2.out' }, 0)
      .from('.hero__latin', { opacity: 0, y: 14, letterSpacing: '0.9em', duration: 1.3 }, 0.25);

    if (heroChars) {
      heroTl.from(heroChars, { yPercent: 118, duration: 1.15, stagger: 0.045 }, 0.45);
    }

    heroTl
      .from('.hero__meta',  { opacity: 0, y: 16, duration: 1 }, 0.95)
      .from('.hero__venue', { opacity: 0, y: 16, duration: 1 }, 1.05)
      .from('.countdown', { opacity: 0, duration: 0.9 }, 1.15)
      .from('.countdown__cell', { opacity: 0, y: 18, duration: 0.9, stagger: 0.08 }, 1.2);

    /* Hero 图随卷动往下沉一点，制造纵深 */
    gsap.to('.hero__media img', {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    /* --- 文字段落：进画面时升起 -------------------------------------- */
    gsap.utils.toArray('.reveal').forEach(function (el, i) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.05,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    /* --- 有 data-split 的标题／句子：逐字或逐行进场 -------------------- */
    fontsReady.then(function () {
      gsap.utils.toArray('[data-split]').forEach(function (el) {
        if (el === heroNames) return;                     /* Hero 另外处理 */
        var mode = el.getAttribute('data-split');

        var sp = SplitText.create(el, {
          type: mode === 'chars' ? 'chars,words' : 'lines',
          mask: mode === 'chars' ? 'chars' : 'lines',
          aria: 'auto'
        });
        splits.push(sp);

        var targets = mode === 'chars' ? sp.chars : sp.lines;
        gsap.from(targets, {
          yPercent: 110,
          duration: mode === 'chars' ? 0.9 : 1.1,
          stagger: mode === 'chars' ? 0.028 : 0.12,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true }
        });
      });
      ScrollTrigger.refresh();
    });

    /* --- 照片：幕布式揭开 + 内层缓速视差 ------------------------------ */
    gsap.utils.toArray('.reveal-img').forEach(function (fig) {
      var img = fig.querySelector('img');

      gsap.to(fig, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.35, ease: 'power3.inOut',
        scrollTrigger: { trigger: fig, start: 'top 85%', once: true }
      });

      if (img) {
        gsap.set(img, { scale: 1.09 });
        gsap.fromTo(img,
          { yPercent: -3.5 },
          {
            yPercent: 3.5, ease: 'none',
            scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true }
          });
      }
    });

    /* --- 第二章的「囍」：随卷动放大定位 -------------------------------- */
    var xi = $('.xi-mark');
    if (xi) {
      gsap.fromTo(xi,
        { opacity: 0, scale: 0.78, rotate: -6 },
        {
          opacity: 0.95, scale: 1, rotate: 0, duration: 1.4, ease: 'power4.out',
          scrollTrigger: { trigger: xi, start: 'top 82%', once: true }
        });
      /* 之后随卷动缓缓再放大一点，红底那段才不会太静 */
      gsap.to(xi, {
        scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: '.ch-xi', start: 'top top', end: 'bottom top', scrub: 1 }
      });
    }

    /* --- 四项资讯：一项一项落下 ---------------------------------------- */
    var facts = $$('.fact');
    if (facts.length) {
      gsap.from(facts, {
        opacity: 0, y: 26, duration: 0.9, stagger: 0.1,
        scrollTrigger: { trigger: '.facts', start: 'top 85%', once: true }
      });
    }

    /* --- 红线：随卷动一路描下来 ---------------------------------------- */
    (function thread() {
      var svg  = $('#thread');
      var path = $('#threadPath');
      var grad = $('#threadGrad');
      var content = $('#smooth-content') || document.body;
      if (!svg || !path) return;

      /* 用真实像素座标画，描线长度才跟卷动进度对得上 */
      function build() {
        var W = svg.clientWidth || 24;
        var H = content.scrollHeight;
        svg.style.height = H + 'px';
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

        var waves = Math.max(3, Math.round(H / 900));   /* 每约 900px 一个来回 */
        var steps = waves * 24;
        var amp   = W * 0.4;
        var d = '';
        for (var i = 0; i <= steps; i++) {
          var t = i / steps;
          var x = (W / 2 + amp * Math.sin(t * waves * Math.PI * 2)).toFixed(2);
          var y = (t * H).toFixed(1);
          d += (i === 0 ? 'M' : 'L') + x + ',' + y;
        }
        path.setAttribute('d', d);

        /* 大红底的章节上红线看不见 —— 那一段换成描金 */
        var xiSec = $('.ch-xi');
        if (xiSec && grad) {
          var box = xiSec.getBoundingClientRect();
          var top = (box.top + window.scrollY) / H;
          var bot = (box.bottom + window.scrollY) / H;
          var NS  = 'http://www.w3.org/2000/svg';
          while (grad.firstChild) grad.removeChild(grad.firstChild);
          [[Math.max(0, top - 0.012), '#C21F26'],
           [top,                      '#E0CDA9'],
           [bot,                      '#E0CDA9'],
           [Math.min(1, bot + 0.012), '#C21F26']].forEach(function (pair) {
            var st = document.createElementNS(NS, 'stop');
            st.setAttribute('offset', pair[0]);
            st.setAttribute('stop-color', pair[1]);
            grad.appendChild(st);
          });
        }
      }

      build();
      ScrollTrigger.addEventListener('refreshInit', build);

      gsap.fromTo(path,
        { drawSVG: '0% 0%' },
        {
          drawSVG: '0% 100%', ease: 'none',
          scrollTrigger: {
            trigger: content,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.4,
            invalidateOnRefresh: true
          }
        });
    })();

    /* --- RSVP 上方的绳结：线走到这里打个结 ----------------------------- */
    var knot = $('#knotPath');
    if (knot) {
      gsap.fromTo(knot,
        { drawSVG: '0% 0%' },
        {
          drawSVG: '0% 100%', duration: 1.9, ease: 'power2.inOut',
          scrollTrigger: { trigger: '.knot', start: 'top 82%', once: true }
        });
    }

    /* --- 按钮：滑过去的时候微微浮起 ------------------------------------ */
    $$('.btn').forEach(function (b) {
      var lift = gsap.to(b, { y: -3, duration: 0.35, paused: true, ease: 'power2.out' });
      b.addEventListener('mouseenter', function () { lift.play(); });
      b.addEventListener('mouseleave', function () { lift.reverse(); });
      b.addEventListener('focus',      function () { lift.play(); });
      b.addEventListener('blur',       function () { lift.reverse(); });
    });

    /* matchMedia 结束（例如使用者切成 reduce）时，把切好的文字还原 */
    return function cleanup() {
      splits.forEach(function (sp) { sp.revert(); });
      if (smoother) { smoother.kill(); smoother = null; }
    };
  });

})();

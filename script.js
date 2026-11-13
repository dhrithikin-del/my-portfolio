(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Preloader */
  var pre = $('#preloader');
  document.body.classList.add('loading');
  function hidePre() {
    if (!pre) return;
    pre.classList.add('done');
    document.body.classList.remove('loading');
    startReveals();
  }
  setTimeout(hidePre, 1300);

  /* Split headings into masked words */
  $$('.split').forEach(function (el) {
    var out = [], i = 0;
    el.setAttribute('aria-label', el.textContent.trim());
    Array.prototype.forEach.call(el.childNodes, function (n) {
      if (n.nodeName === 'BR') { out.push('<br>'); return; }
      n.textContent.trim().split(/\s+/).filter(Boolean).forEach(function (w) {
        out.push('<span class="w" aria-hidden="true"><span style="transition-delay:' + (i++ * 0.06) + 's">' + w.replace(/&/g, '&amp;') + '</span></span>');
      });
    });
    el.innerHTML = out.join(' ');
  });

  /* Counters */
  function runCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0, cur = 0;
    var step = Math.max(1, Math.ceil(target / 60));
    var t = setInterval(function () {
      cur += step;
      if (cur >= target) { cur = target; clearInterval(t); }
      el.textContent = cur;
    }, 26);
  }

  /* Reveal on scroll */
  function startReveals() {
    var items = $$('.reveal, .split');
    function show(el) {
      el.classList.add('in');
      $$('[data-count]', el).forEach(function (c) { if (!c.dataset.done) { c.dataset.done = 1; runCount(c); } });
      if (el.hasAttribute('data-count') && !el.dataset.done) { el.dataset.done = 1; runCount(el); }
    }
    if (!('IntersectionObserver' in window) || reduce) { items.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* Header hide/show, progress bar, to-top, parallax */
  var header = $('#siteHeader'), bar = $('#progress'), toTop = $('#toTop');
  var lastY = window.scrollY, ticking = false;
  var parallax = $$('[data-speed]');

  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    if (header) {
      header.classList.toggle('stuck', y > 160);
      var open = $('#mainNav').classList.contains('open');
      header.classList.toggle('hide', y > lastY && y > 400 && !open);
    }
    if (toTop) toTop.classList.toggle('show', y > 700);
    lastY = y;

    if (!reduce) {
      parallax.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        var offset = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.getAttribute('data-speed'));
        el.style.translate = '0 ' + offset.toFixed(1) + 'px';
      });
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* Active nav link */
  var links = $$('.main-nav a[href^="#"]:not(.nav-cta)');
  if ('IntersectionObserver' in window) {
    var secs = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(function (s) { so.observe(s); });
  }

  /* Mobile menu */
  var btn = $('.menu-btn'), nav = $('#mainNav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('a', nav).forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); });
    });
  }

  /* Magnetic buttons */
  if (!reduce && matchMedia('(hover:hover)').matches) {
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* Gallery drag-to-scroll */
  var g = $('#galTrack');
  if (g) {
    var down = false, sx = 0, sl = 0;
    g.addEventListener('mousedown', function (e) { down = true; g.classList.add('drag'); sx = e.pageX; sl = g.scrollLeft; });
    window.addEventListener('mouseup', function () { down = false; g.classList.remove('drag'); });
    g.addEventListener('mousemove', function (e) { if (!down) return; e.preventDefault(); g.scrollLeft = sl - (e.pageX - sx); });
  }

  /* Footer year */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* Showreel autoplay + sound button */
  var rv = $('#showreelVideo');
  if (rv) {
    var tryPlay = function () { var p = rv.play(); if (p && p.catch) p.catch(function () {}); };
    tryPlay();
    rv.addEventListener('loadeddata', tryPlay);
    var addBtn = function () {
      if ($('.sound-btn')) return;
      var sb = document.createElement('button');
      sb.className = 'sound-btn'; sb.type = 'button'; sb.textContent = 'SOUND ON';
      rv.parentNode.appendChild(sb);
      sb.addEventListener('click', function () { rv.muted = false; rv.volume = 1; tryPlay(); sb.remove(); });
    };
    if (rv.readyState >= 2) addBtn(); else rv.addEventListener('loadeddata', addBtn, { once: true });
  }
})();
document.getElementById("toTop").addEventListener("click", function(e) {
    e.preventDefault();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});
(function () {
  var doc = document;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Menu no celular ---------- */
  var nav = doc.getElementById('nav');
  var toggle = doc.querySelector('.nav__toggle');
  var menu = doc.getElementById('menu');
  if (toggle && menu) {
    var closeMenu = function () { menu.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- Idiomas ---------- */
  var LANGS = { pt: { html: 'pt-BR', code: 'PT' }, en: { html: 'en', code: 'EN' }, es: { html: 'es', code: 'ES' }, ja: { html: 'ja', code: 'JA' } };
  var textEls = doc.querySelectorAll('[data-i18n]');
  var ariaEls = doc.querySelectorAll('[data-i18n-aria]');
  var descMeta = doc.querySelector('meta[name="description"]');
  var original = { title: doc.title, desc: descMeta ? descMeta.getAttribute('content') : '' };
  textEls.forEach(function (el) { el.setAttribute('data-pt', el.innerHTML); });
  ariaEls.forEach(function (el) { el.setAttribute('data-pt-aria', el.getAttribute('aria-label')); });

  var sw = doc.querySelector('[data-lang-switch]');
  var btn = sw && sw.querySelector('.lang__btn');
  var list = sw && sw.querySelector('.lang__list');

  function setLang(lang, save) {
    var dict = lang === 'pt' ? null : (window.I18N && window.I18N[lang]);
    if (lang !== 'pt' && !dict) lang = 'pt';
    doc.documentElement.lang = LANGS[lang].html;
    textEls.forEach(function (el) {
      var v = dict ? dict[el.getAttribute('data-i18n')] : el.getAttribute('data-pt');
      if (v == null) v = el.getAttribute('data-pt');
      el.innerHTML = v;
    });
    ariaEls.forEach(function (el) {
      var v = dict ? dict[el.getAttribute('data-i18n-aria')] : el.getAttribute('data-pt-aria');
      if (v != null) el.setAttribute('aria-label', v);
    });
    doc.title = dict && dict['meta.title'] ? dict['meta.title'] : original.title;
    if (descMeta) descMeta.setAttribute('content', dict && dict['meta.desc'] ? dict['meta.desc'] : original.desc);
    if (btn) {
      btn.querySelector('use').setAttribute('href', '#f-' + lang);
      btn.querySelector('.lang__code').textContent = LANGS[lang].code;
    }
    if (list) list.querySelectorAll('button').forEach(function (b) {
      if (b.getAttribute('data-lang') === lang) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    if (save) { try { localStorage.setItem('lang', lang); } catch (e) {} }
  }

  if (sw && btn && list) {
    var closeList = function () { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = list.hidden;
      list.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-lang]');
      if (!b) return;
      setLang(b.getAttribute('data-lang'), true);
      closeList();
      btn.focus();
    });
    doc.addEventListener('click', function (e) { if (!sw.contains(e.target)) closeList(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !list.hidden) { closeList(); btn.focus(); } });
    var saved = null;
    try { saved = localStorage.getItem('lang'); } catch (e) {}
    if (saved && LANGS[saved] && saved !== 'pt') setLang(saved, false);
    else setLang('pt', false);
  }

  /* ---------- Linha sob o menu ao rolar ---------- */
  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Ondas: pausam fora da tela ---------- */
  var waves = doc.querySelectorAll('.waves');
  if ('IntersectionObserver' in window && waves.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-paused', !e.isIntersecting); });
    });
    waves.forEach(function (w) { io.observe(w); });
  }

  /* ---------- Carrossel de fotos ---------- */
  var car = doc.querySelector('[data-carousel]');
  if (car) {
    var track = car.querySelector('.carousel__track');
    var slides = track.children;
    var dotsBox = car.querySelector('.carousel__dots');
    var n = slides.length, index = 0, userTouched = false, hover = false, visible = false, timer = null;
    for (var i = 0; i < n; i++) dotsBox.appendChild(doc.createElement('i'));
    var dots = dotsBox.children;

    var paint = function () {
      for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('is-active', i === index);
    };
    var goTo = function (i, smooth) {
      index = (i + n) % n;
      track.scrollTo({ left: index * track.clientWidth, behavior: (smooth === false || reduce) ? 'auto' : 'smooth' });
      paint();
    };
    var raf = 0;
    track.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== index) { index = i; paint(); }
      });
    }, { passive: true });

    car.querySelector('.carousel__btn--prev').addEventListener('click', function () { userTouched = true; goTo(index - 1); });
    car.querySelector('.carousel__btn--next').addEventListener('click', function () { userTouched = true; goTo(index + 1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { userTouched = true; goTo(index - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { userTouched = true; goTo(index + 1); e.preventDefault(); }
    });
    track.addEventListener('pointerdown', function () { userTouched = true; });
    car.addEventListener('mouseenter', function () { hover = true; });
    car.addEventListener('mouseleave', function () { hover = false; });
    window.addEventListener('resize', function () { goTo(index, false); });
    paint();

    // passa sozinho a cada poucos segundos, só enquanto está na tela
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !timer) {
          timer = setInterval(function () { if (visible && !hover && !userTouched && !doc.hidden) goTo(index + 1); }, 4200);
        } else if (!visible && timer) { clearInterval(timer); timer = null; }
      }, { threshold: 0.4 }).observe(car);
    }
  }

  /* ---------- Ano no rodapé ---------- */
  var year = doc.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();

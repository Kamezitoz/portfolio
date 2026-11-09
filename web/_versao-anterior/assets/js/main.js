/* =========================================================
   Giovanne Egidio — Portfólio "Seja Água"
   JavaScript puro, sem dependências.
   ========================================================= */
(() => {
  'use strict';

  const doc = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- Datas ---------- */
  const year = new Date().getFullYear();
  $$('[data-years]').forEach(el => {
    const n = Math.max(1, year - 2019);
    el.textContent = n;
    el.dataset.count = n;
  });
  $$('[data-year]').forEach(el => { el.textContent = year; });

  /* ---------- Abertura ---------- */
  let seen = false;
  try {
    seen = sessionStorage.getItem('gio-seen') === '1';
    sessionStorage.setItem('gio-seen', '1');
  } catch (e) { /* armazenamento indisponível */ }
  if (seen) doc.classList.add('is-quick');

  const t0 = performance.now();
  const minTime = reduce ? 0 : (seen ? 300 : 1900);
  let readyResolve;
  const readyP = new Promise(r => { readyResolve = r; });
  const fontsP = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsP, new Promise(r => setTimeout(r, 2600))]).then(() => {
    setTimeout(() => {
      doc.classList.add('is-ready');
      readyResolve();
    }, Math.max(0, minTime - (performance.now() - t0)));
  });

  /* ---------- Texto dividido em palavras ---------- */
  const wrapWords = (el, makeWord) => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            frag.appendChild(makeWord(part, i++));
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
    return i;
  };

  $$('[data-split]').forEach(el => {
    wrapWords(el, (txt, i) => {
      const w = document.createElement('span');
      const inner = document.createElement('span');
      w.className = 'w';
      inner.textContent = txt;
      inner.style.setProperty('--i', i);
      w.appendChild(inner);
      return w;
    });
  });

  const quoteP = $('[data-words]');
  let quoteWords = [];
  if (quoteP) {
    wrapWords(quoteP, txt => {
      const s = document.createElement('span');
      s.className = 'word';
      s.textContent = txt;
      return s;
    });
    quoteWords = $$('.word', quoteP);
  }

  /* ---------- Revelação ao rolar ---------- */
  $$('[data-reveal]').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal'));
    if (sibs.length > 1) el.style.setProperty('--d', (sibs.indexOf(el) % 4) * 0.09 + 's');
  });

  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('is-in');
      revealIO.unobserve(el);
      if (el.hasAttribute('data-reveal')) {
        // devolve as transições próprias do elemento (hover) depois da entrada
        const delay = parseFloat(el.style.getPropertyValue('--d')) || 0;
        setTimeout(() => {
          el.removeAttribute('data-reveal');
          el.style.removeProperty('--d');
        }, 1300 + delay * 1000);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
  $$('[data-reveal], [data-split]').forEach(el => revealIO.observe(el));

  /* ---------- Contadores ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target;
      const end = parseInt(el.dataset.count, 10) || 0;
      readyP.then(() => {
        if (reduce) { el.textContent = end; return; }
        const start = performance.now();
        const dur = 1600;
        const tick = now => {
          const p = clamp((now - start) / dur, 0, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        el.textContent = '0';
        setTimeout(() => requestAnimationFrame(tick), 500);
      });
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- Navegação ---------- */
  const nav = $('#nav');
  const toggle = $('.nav__toggle');
  const mmenu = $('#mobile-menu');
  let menuOpen = false;

  const setMenu = open => {
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (open) {
      mmenu.hidden = false;
      nav.classList.remove('is-hidden');
      requestAnimationFrame(() => mmenu.classList.add('is-open'));
      doc.style.overflow = 'hidden';
    } else {
      mmenu.classList.remove('is-open');
      doc.style.overflow = '';
      setTimeout(() => { if (!menuOpen) mmenu.hidden = true; }, 800);
    }
  };
  toggle.addEventListener('click', () => setMenu(!menuOpen));
  $$('a', mmenu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { setMenu(false); toggle.focus(); } });
  addEventListener('resize', () => { if (menuOpen && innerWidth > 1080) setMenu(false); });

  const navLinks = $$('.nav__menu a');
  const sectionIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = '#' + e.target.id;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => sectionIO.observe(s));

  /* ---------- Trilhos de arte (loop contínuo) ---------- */
  $$('[data-rail] .art__track').forEach(track => {
    [...track.children].forEach(li => {
      const clone = li.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      $$('a', clone).forEach(a => { a.tabIndex = -1; });
      track.appendChild(clone);
    });
  });
  $$('.art-card img').forEach(img => {
    const broken = () => img.closest('.art-card').classList.add('is-broken');
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) broken();
    img.addEventListener('error', broken);
  });

  /* ---------- Formulário → WhatsApp ---------- */
  const form = $('#wa-form');
  if (form) {
    const err = $('.form__error', form);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = form.elements;
      const nome = f.nome.value.trim();
      if (!nome) { err.hidden = false; f.nome.focus(); return; }
      err.hidden = true;
      const tipos = $$('input[name="tipo"]:checked', form).map(i => i.value);
      const msg = f.mensagem.value.trim();
      let text = `Olá, Giovanne! Me chamo ${nome}.`;
      if (tipos.length) text += `\nTenho interesse em: ${tipos.join(', ')}.`;
      if (msg) text += `\n\n${msg}`;
      text += '\n\n(Vim pelo seu portfólio)';
      window.open('https://wa.me/5513997140972?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
    $('input[name="nome"]', form).addEventListener('input', () => { err.hidden = true; });
  }

  /* ---------- Respingos ao clicar ---------- */
  if (!reduce) {
    addEventListener('pointerdown', e => {
      for (let k = 0; k < 2; k++) {
        const s = document.createElement('span');
        s.className = 'splash';
        s.style.left = e.clientX + 'px';
        s.style.top = e.clientY + 'px';
        s.style.animationDelay = k * 0.12 + 's';
        document.body.appendChild(s);
        s.addEventListener('animationend', () => s.remove());
      }
    }, { passive: true });
  }

  /* ---------- Cursor ---------- */
  const cursor = $('.cursor');
  const cDot = $('.cursor__dot');
  const cRing = $('.cursor__ring');
  const cLabel = $('.cursor__label');
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2, seen: false };

  if (fine && !reduce) {
    doc.classList.add('has-cursor');
    cursor.classList.add('is-hidden');
    addEventListener('pointermove', e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!mouse.seen) {
        mouse.seen = true;
        mouse.rx = mouse.x;
        mouse.ry = mouse.y;
        cursor.classList.remove('is-hidden');
      }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { mouse.seen = false; cursor.classList.add('is-hidden'); });
    document.addEventListener('pointerover', e => {
      const labeled = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, label, summary');
      if (labeled) {
        cLabel.textContent = labeled.dataset.cursor;
        cursor.classList.add('is-label');
        cursor.classList.remove('is-link');
      } else if (link) {
        cursor.classList.add('is-link');
        cursor.classList.remove('is-label');
      } else {
        cursor.classList.remove('is-link', 'is-label');
      }
    });

    /* botões magnéticos */
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    /* cases com inclinação e luz */
    $$('.case__media').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((px - 0.5) * 6).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - py) * 5).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Prévia dos sites de suporte ---------- */
  const preview = $('.preview');
  const pImg = preview ? $('img', preview) : null;
  const prev = { x: 0, y: 0, tx: 0, ty: 0, on: false };
  if (fine && preview) {
    $$('.support__item').forEach(a => {
      a.addEventListener('pointerenter', e => {
        if (pImg.getAttribute('src') !== a.dataset.preview) pImg.src = a.dataset.preview;
        if (!prev.on) { prev.x = e.clientX + 30; prev.y = e.clientY - 110; }
        prev.on = true;
        preview.classList.add('is-on');
      });
      a.addEventListener('pointerleave', () => {
        prev.on = false;
        preview.classList.remove('is-on');
      });
    });
    addEventListener('pointermove', e => {
      const w = preview.offsetWidth || 320;
      prev.tx = clamp(e.clientX + 30, 10, innerWidth - w - 10);
      prev.ty = clamp(e.clientY - 110, 10, innerHeight - w * 0.625 - 10);
    }, { passive: true });
  }

  /* ---------- Hero: bolhas, partículas e ondulações ---------- */
  const hero = $('.hero');
  const canvas = $('.hero__canvas');
  const portrait = $('.portrait');
  const heroState = { visible: true, mx: -999, my: -999, px: 0, py: 0, tpx: 0, tpy: 0, lastRipple: 0 };
  let ctx, cw = 0, ch = 0;
  const parts = [];
  const ripples = [];

  const newPart = init => {
    const bubble = Math.random() < 0.2;
    return {
      x: rand(0, cw),
      y: init ? rand(0, ch) : ch + rand(10, 60),
      r: bubble ? rand(2.5, 6.5) : rand(0.6, 2),
      vy: bubble ? rand(0.35, 0.9) : rand(0.08, 0.35),
      sway: rand(0, Math.PI * 2),
      swaySpeed: rand(0.006, 0.02),
      amp: rand(4, 14),
      a: bubble ? rand(0.25, 0.55) : rand(0.15, 0.6),
      bubble,
      ox: 0,
    };
  };

  const resizeCanvas = () => {
    if (!canvas) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cw = canvas.clientWidth;
    ch = canvas.clientHeight;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  if (canvas && !reduce) {
    ctx = canvas.getContext('2d');
    resizeCanvas();
    const n = innerWidth < 700 ? 30 : 64;
    for (let i = 0; i < n; i++) parts.push(newPart(true));
    addEventListener('resize', resizeCanvas);
    new IntersectionObserver(([e]) => { heroState.visible = e.isIntersecting; }).observe(hero);

    hero.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      heroState.mx = e.clientX - r.left;
      heroState.my = e.clientY - r.top;
      heroState.tpx = (e.clientX / innerWidth - 0.5) * 2;
      heroState.tpy = (e.clientY / innerHeight - 0.5) * 2;
      const now = performance.now();
      if (now - heroState.lastRipple > 140 && e.pointerType === 'mouse') {
        heroState.lastRipple = now;
        ripples.push({ x: heroState.mx, y: heroState.my, r: 2, a: 0.35 });
      }
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { heroState.mx = heroState.my = -999; heroState.tpx = heroState.tpy = 0; });
    hero.addEventListener('pointerdown', e => {
      const r = canvas.getBoundingClientRect();
      for (let k = 0; k < 3; k++) ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, r: 2 + k * 14, a: 0.6 - k * 0.15 });
    }, { passive: true });
  }

  const drawHero = () => {
    ctx.clearRect(0, 0, cw, ch);
    for (const p of parts) {
      p.y -= p.vy;
      p.sway += p.swaySpeed;
      let x = p.x + Math.sin(p.sway) * p.amp;
      // a água desvia do cursor
      const dx = x + p.ox - heroState.mx;
      const dy = p.y - heroState.my;
      const d2 = dx * dx + dy * dy;
      if (d2 < 14400) {
        const d = Math.sqrt(d2) || 1;
        p.ox += (dx / d) * (120 - d) * 0.04;
      }
      p.ox *= 0.96;
      x += p.ox;
      if (p.y < -20) Object.assign(p, newPart(false));
      const fade = clamp(p.y / ch, 0, 1);
      ctx.beginPath();
      ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
      if (p.bubble) {
        ctx.strokeStyle = `rgba(102,255,255,${(p.a * (0.35 + fade)).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(234,252,251,${(p.a * 0.8).toFixed(3)})`;
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(102,255,255,${(p.a * (0.3 + fade * 0.7)).toFixed(3)})`;
        ctx.fill();
      }
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.r += 1.6;
      rp.a *= 0.955;
      if (rp.a < 0.01) { ripples.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.42, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(102,255,255,${rp.a.toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  };

  /* ---------- Texto que corre na onda ---------- */
  const flowSvg = $('.flow__svg');
  const flowTP = $('.flow textPath');
  const flow = { off: 0, seg: 0, boost: 0, visible: true };
  if (flowTP) {
    const measure = () => {
      const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tmp.setAttribute('class', 'flow__text');
      tmp.textContent = 'Web Design ✦ UI/UX ✦ Identidade Visual ✦ Ilustração Digital ✦ Social Media ✦ Front-end ✦ ';
      tmp.setAttribute('xml:space', 'preserve');
      tmp.style.whiteSpace = 'pre';
      flowSvg.appendChild(tmp);
      flow.seg = tmp.getComputedTextLength();
      tmp.remove();
    };
    measure();
    fontsP.then(measure);
    new IntersectionObserver(([e]) => { flow.visible = e.isIntersecting; }).observe(flowSvg);
  }

  /* ---------- Ao rolar ---------- */
  const timeline = $('[data-timeline]');
  const processLine = $('.process__line path');
  const processWrap = $('.process__wrap');
  const depthFill = $('.depth__fill');
  const depthVal = $('.depth__value b');
  let lastY = scrollY;
  let lit = -1;
  let scrollQueued = false;

  if (processLine) {
    const len = Math.ceil(processLine.getTotalLength());
    processLine.style.setProperty('--len', len);
  }

  const onScroll = () => {
    scrollQueued = false;
    const y = scrollY;
    const vh = innerHeight;
    const dy = y - lastY;

    nav.classList.toggle('is-scrolled', y > 30);
    if (!menuOpen) {
      if (dy > 6 && y > 500) nav.classList.add('is-hidden');
      else if (dy < -6 || y < 500) nav.classList.remove('is-hidden');
    }
    flow.boost = clamp(flow.boost + Math.abs(dy) * 0.06, 0, 9);
    lastY = y;

    // profundímetro
    const max = Math.max(1, doc.scrollHeight - vh);
    const p = clamp(y / max, 0, 1);
    if (depthFill) {
      depthFill.style.transform = `scaleY(${p.toFixed(4)})`;
      depthVal.textContent = Math.round(p * 1100).toLocaleString('pt-BR');
    }

    // linha do tempo enchendo
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      timeline.style.setProperty('--p', clamp((vh * 0.62 - r.top) / r.height, 0, 1).toFixed(4));
    }

    // citação acendendo palavra por palavra
    if (quoteWords.length && !reduce) {
      const r = quoteP.getBoundingClientRect();
      const prog = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.3), 0, 1);
      const n = Math.round(prog * quoteWords.length);
      if (n !== lit) {
        lit = n;
        quoteWords.forEach((w, i) => w.classList.toggle('is-lit', i < n));
      }
    }

    // linha do processo desenhando
    if (processLine && processWrap.offsetParent !== null) {
      const r = processWrap.getBoundingClientRect();
      processLine.style.setProperty('--p', clamp((vh * 0.85 - r.top) / (vh * 0.6), 0, 1).toFixed(4));
    }
  };
  addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Laço principal ---------- */
  const loop = () => {
    // cursor
    if (fine && !reduce && mouse.seen) {
      mouse.rx = lerp(mouse.rx, mouse.x, 0.18);
      mouse.ry = lerp(mouse.ry, mouse.y, 0.18);
      cDot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
      cRing.style.transform = `translate3d(${mouse.rx.toFixed(1)}px, ${mouse.ry.toFixed(1)}px, 0)`;
    }

    // prévia
    if (preview && (prev.on || preview.classList.contains('is-on'))) {
      prev.x = lerp(prev.x, prev.tx, 0.16);
      prev.y = lerp(prev.y, prev.ty, 0.16);
      preview.style.translate = `${prev.x.toFixed(1)}px ${prev.y.toFixed(1)}px`;
    }

    // hero
    if (ctx && heroState.visible) {
      drawHero();
      if (portrait && fine) {
        heroState.px = lerp(heroState.px, heroState.tpx, 0.06);
        heroState.py = lerp(heroState.py, heroState.tpy, 0.06);
        portrait.style.transform = `perspective(900px) rotateY(${(heroState.px * 8).toFixed(2)}deg) rotateX(${(-heroState.py * 8).toFixed(2)}deg) translate3d(${(heroState.px * -10).toFixed(1)}px, ${(heroState.py * -10).toFixed(1)}px, 0)`;
      }
    }

    // onda de texto
    if (flowTP && flow.visible && flow.seg && !reduce) {
      flow.off -= 0.7 + flow.boost;
      flow.boost *= 0.93;
      if (flow.off <= -flow.seg) flow.off += flow.seg;
      flowTP.setAttribute('startOffset', flow.off.toFixed(1));
    }

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();

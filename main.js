/* Pen and Sword: interaction layer.
   GSAP + ScrollTrigger for scroll choreography, Lenis for smooth wheel scrolling.
   Everything degrades to a calm, static page under prefers-reduced-motion. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // With large browser text the pinned day can't fit a screen, so it falls back to a plain vertical list
  const BIG_TEXT = parseFloat(getComputedStyle(document.documentElement).fontSize) >= 22;
  const STATIC_DAY = REDUCED || BIG_TEXT;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const HAS_GSAP = !!(window.gsap && window.ScrollTrigger);
  const FOREST = '#333D29';
  const FEATHER = '#FFFEF4';
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  // Pinned, scroll-driven sections misbehave when the browser restores a mid-page position on reload
  if ('scrollRestoration' in history && !location.hash) history.scrollRestoration = 'manual';

  /* ---------- Marks: nested groups so intro and scroll can move them independently ---------- */
  $$('[data-mark]').forEach((svg) => {
    svg.innerHTML =
      '<g class="m-quill"><g class="m-in"><use href="#g-quill"/></g></g>' +
      '<g class="m-sword"><g class="m-in"><use href="#g-sword"/></g></g>';
  });

  /* ---------- Products ---------- */
  const list = $('[data-products]');
  const markSvg = '<svg class="mark piece__mark" viewBox="0 0 176 224" aria-hidden="true">' +
    '<g class="m-quill"><use href="#g-quill"/></g><g class="m-sword"><use href="#g-sword"/></g></svg>';
  (window.PRODUCTS || []).forEach((p) => {
    const li = document.createElement('li');
    li.className = 'piece';
    const img = `<img src="${p.image}" alt="${p.imageAlt || p.name}" loading="lazy" decoding="async" style="object-position:${p.focus || '50% 50%'}">`;
    const media = !p.image ? markSvg : p.webp
      ? `<picture><source type="image/webp" srcset="${p.webp}" sizes="(min-width: 900px) 24vw, 72vw">${img}</picture>`
      : img;
    const tag = p.href ? 'a' : 'div';
    li.innerHTML = `
      <${tag} class="piece__tile" data-tile${p.href ? ` href="${p.href}"` : ''}>
        <span class="piece__no">No. ${p.no}</span>
        <div class="piece__layer">${media}</div>
      </${tag}>
      <div class="piece__meta">
        <h3 class="piece__name">${p.name}</h3>
        <p class="piece__price">${p.price == null ? '£ TBC' : p.price}</p>
        <p class="piece__detail">${p.detail}</p>
      </div>`;
    list.appendChild(li);
  });

  /* ---------- Looks (desk to drinks): line drawings that draw themselves in ---------- */
  $$('[data-look]').forEach((el) => {
    const [top, bottom] = el.dataset.look.split(',');
    el.innerHTML = Garment(top, 'g-top') + Garment(bottom, 'g-bottom');
  });
  $$('[data-draw]').forEach((svg) => {
    $$('path, rect', svg).forEach((p) => {
      p.setAttribute('pathLength', '1');
      if (!REDUCED && HAS_GSAP) { p.style.strokeDasharray = '1'; p.style.strokeDashoffset = '1'; }
    });
    if (!REDUCED && HAS_GSAP) {
      $$('path:first-of-type', svg).forEach((p) => (p.style.fillOpacity = '0'));
      $$('.g-btn', svg).forEach((g) => (g.style.opacity = '0'));
    }
  });
  const drawn = new WeakSet();
  const draw = (svg, delay = 0) => {
    if (REDUCED || !HAS_GSAP || drawn.has(svg)) return;
    drawn.add(svg);
    gsap.to($$('path, rect', svg), { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.07, delay });
    gsap.to($$('path:first-of-type', svg), { fillOpacity: 1, duration: 1, delay: delay + 0.9, ease: 'power1.out' });
    gsap.to($$('.g-btn', svg), { opacity: 1, duration: 0.6, delay: delay + 1.2 });
  };

  /* ---------- Footer clock: your local time, and what it's for ---------- */
  {
    const t = $('[data-local-time]');
    const v = $('[data-local-verdict]');
    const tick = () => {
      const d = new Date();
      const h = d.getHours();
      t.textContent = `${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      v.textContent = h >= 6 && h < 12 ? 'Desk hours' : h >= 12 && h < 17 ? 'Still desk hours'
        : h >= 17 && h < 22 ? 'Drinks hours' : 'After hours';
    };
    tick();
    setInterval(tick, 20000);
  }

  /* ---------- No GSAP (CDN blocked) or reduced motion: show everything, keep it usable ---------- */
  if (!HAS_GSAP || STATIC_DAY) $('.day').classList.add('is-static');
  if (!HAS_GSAP || REDUCED) {
    document.body.classList.remove('is-loading');
    if (!HAS_GSAP) {
      $('.hero__word .wordmark').style.clipPath = 'none';
      $$('.hero__line, .scrollcue').forEach((e) => (e.style.opacity = 1));
    }
  }

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (HAS_GSAP) gsap.registerPlugin(ScrollTrigger);
  if (HAS_GSAP && window.Lenis && !REDUCED) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target, opts = {}) => {
    if (lenis) return lenis.scrollTo(target, { duration: 1.6, ...opts });
    const behavior = REDUCED ? 'auto' : 'smooth';
    if (typeof target === 'number') window.scrollTo({ top: target, behavior });
    else target.scrollIntoView({ behavior });
  };

  /* ---------- Nav: hide on scroll down, recolour over dark sections ---------- */
  const nav = $('[data-nav]');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    if (!sheetOpen) nav.classList.toggle('is-hidden', y > lastY && y > 300);
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });

  const darkZones = new Set();
  const syncNavTone = () => nav.classList.toggle('is-dark', darkZones.size > 0);
  const navOver = (el, key) => {
    if (!HAS_GSAP) return;
    ScrollTrigger.create({
      trigger: el, start: 'top 32px', end: 'bottom 32px',
      onToggle: (st) => { st.isActive ? darkZones.add(key) : darkZones.delete(key); syncNavTone(); },
    });
  };

  /* ---------- Menu sheet ---------- */
  const menuBtn = $('[data-menu]');
  const sheet = $('#sheet');
  let sheetOpen = false;
  const setSheet = (open) => {
    sheetOpen = open;
    menuBtn.setAttribute('aria-expanded', String(open));
    $('.nav__menu-label', menuBtn).textContent = open ? 'Close' : 'Menu';
    if (open) {
      sheet.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        sheet.classList.add('is-open');
        $('a', sheet).focus({ preventScroll: true });
      }));
      nav.classList.add('is-dark'); nav.classList.remove('is-hidden');
      $$('main, footer, .skip, .nav__links').forEach((el) => (el.inert = true));
      lenis && lenis.stop();
      document.documentElement.style.overflow = 'hidden';
    } else {
      sheet.classList.remove('is-open');
      $$('main, footer, .skip, .nav__links').forEach((el) => (el.inert = false));
      syncNavTone();
      lenis && lenis.start();
      document.documentElement.style.overflow = '';
      setTimeout(() => { if (!sheetOpen) sheet.hidden = true; }, 800);
    }
  };
  menuBtn.addEventListener('click', () => setSheet(!sheetOpen));
  addEventListener('keydown', (e) => {
    if (!sheetOpen) return;
    if (e.key === 'Escape') { setSheet(false); menuBtn.focus(); return; }
    if (e.key !== 'Tab') return;
    // cycle between the menu button and the sheet links
    const stops = [menuBtn, ...$$('a', sheet)].filter((el) => el.getClientRects().length);
    const i = stops.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); stops[stops.length - 1].focus(); }
    else if (!e.shiftKey && i === stops.length - 1) { e.preventDefault(); stops[0].focus(); }
  });

  /* In-page anchors use the smooth scroller */
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id === '#') { e.preventDefault(); return; }
    const el = $(id);
    if (!el) return;
    e.preventDefault();
    const go = () => scrollTo(id === '#top' ? 0 : el);
    if (sheetOpen) { setSheet(false); setTimeout(go, 350); } else go();
  }));
  $('[data-totop]').addEventListener('click', () => {
    scrollTo(0, { duration: 2.2 });
    if (HAS_GSAP && !REDUCED) {
      const m = $('.mark--nav');
      gsap.fromTo($$('.m-sword', m), { rotate: 0 }, { rotate: -360, duration: 2.2, ease: 'expo.inOut', clearProps: 'rotate' });
    }
  });

  /* ---------- Cursor ---------- */
  if (FINE && HAS_GSAP) {
    const cur = $('.cursor');
    const label = $('.cursor__label', cur);
    document.body.classList.add('has-cursor');
    const xTo = gsap.quickTo(cur, 'x', { duration: 0.45, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: 0.45, ease: 'power3' });
    addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    document.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button');
      cur.classList.toggle('is-label', !!lab);
      cur.classList.toggle('is-link', !lab && !!link);
      if (lab) label.textContent = lab.dataset.cursor;
    });
  }

  /* ---------- Magnetic controls ---------- */
  if (FINE && HAS_GSAP && !REDUCED) {
    $$('.arrow, .nav__menu, [data-totop], .nav__brand').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'expo.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'expo.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Values: one open at a time; scroll, hover or tap opens ---------- */
  const values = $$('.value');
  let hoverLock = false;
  const setValue = (idx) => values.forEach((v, i) => {
    const on = i === idx;
    v.classList.toggle('is-active', on);
    $('.value__btn', v).setAttribute('aria-expanded', String(on));
  });
  values.forEach((v, i) => {
    const btn = $('.value__btn', v);
    btn.addEventListener('click', () => setValue(v.classList.contains('is-active') && !FINE ? -1 : i));
    if (FINE) {
      v.addEventListener('pointerenter', () => { hoverLock = true; setValue(i); });
      v.addEventListener('pointerleave', () => { hoverLock = false; });
    }
  });
  if (HAS_GSAP) {
    values.forEach((v, i) => ScrollTrigger.create({
      trigger: v, start: 'top 62%', end: 'bottom 62%', refreshPriority: -1,
      onToggle: (st) => { if (st.isActive && !hoverLock) setValue(i); },
    }));
  } else setValue(0);

  /* ---------- Product rail ---------- */
  const rail = $('[data-rail-scroller]');
  const bar = $('[data-rail-progress]');
  const prev = $('[data-prev]');
  const next = $('[data-next]');
  rail.dataset.cursor = '\u2190 \u2192';
  const railUpdate = () => {
    const max = rail.scrollWidth - rail.clientWidth;
    const vis = rail.clientWidth / rail.scrollWidth;
    const p = max > 0 ? rail.scrollLeft / max : 0;
    bar.style.width = `${vis * 100}%`;
    bar.style.left = `${p * (1 - vis) * 100}%`;
    prev.disabled = rail.scrollLeft < 4;
    next.disabled = rail.scrollLeft > max - 4;
  };
  rail.addEventListener('scroll', railUpdate, { passive: true });
  addEventListener('resize', railUpdate);
  railUpdate();

  const step = () => {
    const piece = $('.piece', rail);
    const gap = parseFloat(getComputedStyle($('.rail__list')).columnGap) || 16;
    const w = piece.getBoundingClientRect().width + gap;
    return Math.max(1, Math.floor((rail.clientWidth * 0.92) / w)) * w;
  };
  prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: REDUCED ? 'auto' : 'smooth' }));
  next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: REDUCED ? 'auto' : 'smooth' }));

  /* Mouse drag with momentum. Touch uses native scrolling, which already feels right. */
  {
    let down = false, moved = false, startX = 0, startLeft = 0, lastX = 0, lastT = 0, vel = 0, glide = null;
    rail.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = lastX = e.clientX; startLeft = rail.scrollLeft; lastT = performance.now(); vel = 0;
      glide && glide.kill();
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) { moved = true; rail.classList.add('is-dragging'); }
      if (!moved) return;
      rail.scrollLeft = startLeft - dx;
      const now = performance.now();
      vel = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX; lastT = now;
    });
    addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      const target = rail.scrollLeft - vel * 380;
      const finish = () => rail.classList.remove('is-dragging');
      if (HAS_GSAP && !REDUCED) glide = gsap.to(rail, { scrollLeft: target, duration: 0.9, ease: 'expo.out', onComplete: finish });
      else finish();
      rail.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); }, { capture: true, once: true });
    });
  }

  /* Photos wipe up into their tiles as they scroll into view, along the rail or down the page */
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    if (!HAS_GSAP || REDUCED) return;
    const i = $$('.piece').indexOf(en.target);
    const tile = $('.piece__layer', en.target);
    gsap.fromTo(tile, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', delay: (i % 4) * 0.08,
    });
    gsap.fromTo($('img', tile), { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out', delay: (i % 4) * 0.08 });
  }), { threshold: 0.2 });
  $$('.piece').forEach((p) => io.observe(p));

  /* Desktop: the photo leans gently toward the pointer inside its frame */
  if (FINE && HAS_GSAP && !REDUCED) {
    $$('.piece__tile').forEach((tile) => {
      const img = $('img', tile);
      if (!img) return;
      const xTo = gsap.quickTo(img, 'xPercent', { duration: 1, ease: 'power3' });
      const yTo = gsap.quickTo(img, 'yPercent', { duration: 1, ease: 'power3' });
      tile.addEventListener('pointermove', (e) => {
        const r = tile.getBoundingClientRect();
        xTo(((e.clientX - r.left) / r.width - 0.5) * -4);
        yTo(((e.clientY - r.top) / r.height - 0.5) * -4);
      });
      tile.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  if (!HAS_GSAP) return;

  /* ================= Choreography (GSAP) ================= */

  /* Manifesto: split into words now so the reduced-motion page reads normally */
  const manifesto = $('[data-words]');
  const words = manifesto.textContent.trim().split(/\s+/);
  manifesto.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');

  if (REDUCED) {
    $$('.value').length && setValue(0);
    navOver($('.values'), 'values');
    navOver($('.markstory'), 'mark');
    navOver($('.foot'), 'foot');
    return;
  }

  /* ---------- Hero intro ---------- */
  const heroMark = $('[data-hero-mark]');
  const hSword = $('.m-sword .m-in', heroMark);
  const hQuill = $('.m-quill .m-in', heroMark);
  const intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
  gsap.set([hSword, hQuill], { transformOrigin: '50% 50%' });
  intro
    .from('.nav__brand, .nav__links a, .nav__menu', { y: -24, opacity: 0, duration: 1.2, stagger: 0.05 }, 0.2)
    .from(hQuill, { x: 70, y: 80, rotate: -38, opacity: 0, duration: 1.6 }, 0.15)
    .from(hSword, { x: -70, y: -80, rotate: 38, opacity: 0, duration: 1.6 }, 0.28)
    .fromTo(heroMark, { scale: 1 }, { scale: 1.035, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 }, 0.95)
    .to('[data-hero-word]', { clipPath: 'inset(0 0% 0 0)', duration: 1.5, ease: 'power3.inOut' }, 0.7)
    .to('[data-hero-line]', { opacity: 1, duration: 1 }, 1.6)
    .from('.hero__meta span', { y: 14, opacity: 0, stagger: 0.06, duration: 1 }, 1.5)
    .to('.scrollcue', { opacity: 1, duration: 1 }, 2);

  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]);
  fontsReady.then(() => { document.body.classList.remove('is-loading'); intro.play(); ScrollTrigger.refresh(); });

  /* Pointer tilt on desktop */
  if (FINE) {
    const stage = $('[data-tilt]');
    const rx = gsap.quickTo(stage, 'rotationX', { duration: 1.2, ease: 'power3' });
    const ry = gsap.quickTo(stage, 'rotationY', { duration: 1.2, ease: 'power3' });
    $('.hero').addEventListener('pointermove', (e) => {
      ry(((e.clientX / innerWidth) - 0.5) * 18);
      rx(-((e.clientY / innerHeight) - 0.5) * 14);
    });
    $('.hero').addEventListener('pointerleave', () => { rx(0); ry(0); });
  }

  /* Scroll away: the blades part and the mark recedes */
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } })
    .to($('.m-sword', heroMark), { x: -26, y: -10, rotate: -14, ease: 'none' }, 0)
    .to($('.m-quill', heroMark), { x: 26, y: -10, rotate: 14, ease: 'none' }, 0)
    .to('[data-tilt]', { yPercent: 30, scale: 0.86, ease: 'none' }, 0)
    .to('.hero__word', { yPercent: -18, ease: 'none' }, 0)
    .to('.scrollcue', { opacity: 0, ease: 'none', duration: 0.2 }, 0);

  /* ---------- Manifesto word reveal ---------- */
  gsap.to($$('.w', manifesto), {
    opacity: 1, ease: 'none', stagger: 0.08,
    scrollTrigger: { trigger: manifesto, start: 'top 82%', end: 'bottom 40%', scrub: 0.4 },
  });

  /* ---------- Generic rise-in reveals ---------- */
  const revealEls = $$('.manifesto .eyebrow, .values__head > *, .edit__head > *, .foot__top > *');
  revealEls.forEach((el) => el.classList.add('reveal'));
  ScrollTrigger.batch(revealEls, {
    start: 'top 88%', once: true, refreshPriority: -1,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 }),
  });
  gsap.from('.piece', {
    x: 80, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.07,
    scrollTrigger: { trigger: '.rail', start: 'top 85%', once: true, refreshPriority: -1 },
  });

  /* ---------- Desk to drinks ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1px)', () => {
    if (STATIC_DAY) { $$('[data-draw]').forEach((s) => draw(s)); return; }
    const day = $('.day');
    const track = $('[data-track]');
    const clock = $('[data-clock]');
    const phase = $('[data-phase]');
    const railFill = $('[data-rail]');
    const timed = $$('.day__panel[data-time]', track);
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m) % 60).padStart(2, '0')}`;
    const lerpColor = gsap.utils.interpolate(FEATHER, FOREST);
    const lerpColorInv = gsap.utils.interpolate(FOREST, FEATHER);
    let stops = [];
    const distance = () => track.scrollWidth - innerWidth;

    const measure = () => {
      const d = distance();
      stops = timed.map((p) => ({
        at: clamp((p.offsetLeft + p.offsetWidth / 2 - innerWidth / 2) / d),
        min: toMin(p.dataset.time),
        name: p.dataset.phaseName,
      }));
    };

    let dark = false;
    const update = (p) => {
      if (!stops.length) return;
      // clock: piecewise-linear between panel centres
      let m = stops[0].min, name = stops[0].name;
      for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i], b = stops[i + 1];
        if (p >= a.at && p <= b.at) { m = a.min + (b.min - a.min) * ((p - a.at) / (b.at - a.at || 1)); name = (p - a.at) / (b.at - a.at) > 0.5 ? b.name : a.name; }
        if (p > b.at) { m = b.min; name = b.name; }
      }
      clock.textContent = fmt(m);
      phase.textContent = name;
      // dusk: feather to forest between lunch and drinks
      const a = stops[stops.length - 2].at, b = stops[stops.length - 1].at;
      const t = gsap.parseEase('power1.inOut')(clamp((p - a) / (b - a || 1)));
      day.style.setProperty('--day-bg', lerpColor(t));
      day.style.setProperty('--day-fg', lerpColorInv(t));
      railFill.style.transform = `scaleX(${clamp((p - stops[0].at) / (stops[stops.length - 1].at - stops[0].at))})`;
      const isDark = t > 0.5;
      if (isDark !== dark) { dark = isDark; dark ? darkZones.add('day') : darkZones.delete('day'); syncNavTone(); }
    };

    const horiz = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: day,
        pin: true,
        start: 'top top',
        end: () => `+=${distance()}`,
        scrub: 0.8,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onRefresh: (st) => { measure(); update(st.progress); },
        onUpdate: (st) => update(st.progress),
        onLeaveBack: () => { darkZones.delete('day'); syncNavTone(); },
        onLeave: () => { if (!dark) { darkZones.delete('day'); syncNavTone(); } },
      },
    });

    // nav tone only applies while the pinned day is under the bar
    ScrollTrigger.create({
      trigger: day, start: 'top 32px', end: () => `+=${distance() + innerHeight}`,
      onToggle: (st) => { if (!st.isActive) { darkZones.delete('day'); syncNavTone(); } else if (dark) { darkZones.add('day'); syncNavTone(); } },
    });

    // each look draws itself as it slides in; copy rises after
    timed.forEach((panel) => {
      const copy = $$('.day__copy > *', panel);
      gsap.set(copy, { y: 30, opacity: 0 });
      let shown = false;
      const reveal = () => {
        if (shown) return;
        shown = true;
        $$('[data-draw]', panel).forEach((s, i) => draw(s, i * 0.25));
        gsap.to(copy, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.2 });
      };
      // fire on entering, on being skipped past by a fast scroll, or if the page loads already past it
      ScrollTrigger.create({
        trigger: panel, containerAnimation: horiz, start: 'left 80%', end: 'right left',
        onEnter: reveal, onEnterBack: reveal, onLeave: reveal,
        onRefresh: (st) => { if (st.progress > 0) reveal(); },
      });
      gsap.fromTo($('.look', panel), { xPercent: 12 }, {
        xPercent: -12, ease: 'none',
        scrollTrigger: { trigger: panel, containerAnimation: horiz, start: 'left right', end: 'right left', scrub: true },
      });
    });

    gsap.from('.day__title span', {
      yPercent: 60, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: day, start: 'top 70%', once: true },
    });
  });

  /* ---------- Nav over dark sections ---------- */
  navOver($('.values'), 'values');
  navOver($('.markstory'), 'mark');
  navOver($('.foot'), 'foot');

  /* ---------- The mark, assembled by scroll ---------- */
  const story = $('[data-story-mark]');
  gsap.timeline({
    scrollTrigger: { trigger: '.markstory', start: 'top top', end: '+=110%', pin: '.markstory__pin', scrub: 0.7 },
  })
    .fromTo($('.m-sword', story), { x: -62 }, { x: 0, ease: 'power2.inOut', duration: 1 }, 0)
    .fromTo($('.m-sword .m-in', story), { rotate: 37 }, { rotate: 0, ease: 'power2.inOut', duration: 1, transformOrigin: '50% 50%' }, 0)
    .fromTo($('.m-quill', story), { x: 62 }, { x: 0, ease: 'power2.inOut', duration: 1 }, 0)
    .fromTo($('.m-quill .m-in', story), { rotate: -36 }, { rotate: 0, ease: 'power2.inOut', duration: 1, transformOrigin: '50% 50%' }, 0)
    .from('[data-story-a]', { y: 30, opacity: 0, duration: 0.35 }, 0.1)
    .from('[data-story-b]', { y: 30, opacity: 0, duration: 0.35 }, 0.4)
    .from('[data-story-sum]', { y: 30, opacity: 0, duration: 0.3 }, 0.85)
    .fromTo(story, { scale: 0.92 }, { scale: 1.04, duration: 0.15, ease: 'power2.out' }, 0.95)
    .to(story, { scale: 1, duration: 0.15 }, 1.1);

  /* ---------- Footer wordmark rises ---------- */
  gsap.fromTo('.foot__wordmark', { yPercent: 104 }, {
    yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '.foot__word', start: 'top bottom', end: 'bottom bottom', scrub: 0.5 },
  });
  ScrollTrigger.batch('.foot__col li, .foot__h', {
    start: 'top 95%', once: true,
    onEnter: (b) => gsap.from(b, { y: 18, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.04 }),
  });

  /* The rail leans once when it first appears, so it reads as something that moves sideways */
  ScrollTrigger.create({
    trigger: rail, start: 'top 70%', once: true,
    onEnter: () => {
      if (rail.scrollLeft > 4) return;
      gsap.timeline({ delay: 0.9, onStart: () => (rail.style.scrollSnapType = 'none'), onComplete: () => (rail.style.scrollSnapType = '') })
        .to(rail, { scrollLeft: Math.min(90, rail.scrollWidth - rail.clientWidth), duration: 0.9, ease: 'power3.inOut' })
        .to(rail, { scrollLeft: 0, duration: 1.1, ease: 'power3.inOut' }, '+=0.15');
    },
  });

  /* Some triggers below the pinned day were created before it (values, reveals, rail);
     they carry refreshPriority -1 so they're measured after the pin spacing exists. */
  ScrollTrigger.refresh();
  addEventListener('load', () => ScrollTrigger.refresh());
})();

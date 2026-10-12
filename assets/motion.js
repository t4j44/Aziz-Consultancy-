/* Abdul Aziz Tours & Consultancy · Stage 2 motion layer.
 * Runs only when GSAP loaded and the visitor has not asked for reduced motion.
 * Without it the page is complete and static. Everything here is progressive enhancement. */
(function () {
  'use strict';

  var base = document.currentScript ? document.currentScript.src : window.location.href;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var wide = window.matchMedia('(min-width: 960px)').matches;

  gsap.registerPlugin(ST);
  root.classList.add('motion');

  /* ---------- Smooth scroll (desktop with a fine pointer) ---------- */

  var lenis = null;
  if (fine && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    document.addEventListener('click', function (event) {
      var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var id = link.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -96 });
    });
  }

  /* ---------- Intro: hero lines rise in ---------- */

  gsap.fromTo('.hero-title .line',
    { y: 36, opacity: 0 },
    { y: 0, opacity: 1, duration: 1.1, stagger: 0.12, ease: 'power3.out', delay: 0.15 });

  /* ---------- Reveals on entry (chapters, services, updates, forms) ---------- */

  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    gsap.fromTo(el,
      { opacity: 0, y: 28 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
  });

  /* ---------- Proof: the quote lights up word by word as you scroll ---------- */

  var quote = document.querySelector('[data-split]');
  if (quote) {
    var words = quote.textContent.split(' ').map(function (word) {
      return '<span class="w">' + word + '</span>';
    });
    quote.innerHTML = words.join(' ');
    var wordEls = quote.querySelectorAll('.w');
    var quoteTl = gsap.timeline({
      scrollTrigger: { trigger: quote, start: 'top 80%', end: 'bottom 50%', scrub: true }
    });
    quoteTl.fromTo(wordEls, { opacity: 0.18 }, { opacity: 1, duration: 1, stagger: { amount: 0.8 }, ease: 'none' });
  }

  /* ---------- How we work: gold line fills and each step lights up ---------- */

  var steps = document.querySelector('[data-steps]');
  if (steps) {
    var track = document.createElement('span');
    track.className = 'steps-line';
    track.setAttribute('aria-hidden', 'true');
    steps.appendChild(track);

    gsap.fromTo(track, { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: steps, start: 'top 72%', end: 'bottom 48%', scrub: 0.4 }
    });

    gsap.utils.toArray('[data-step]').forEach(function (step) {
      ST.create({
        trigger: step,
        start: 'top 62%',
        onEnter: function () { step.classList.add('on'); },
        onLeaveBack: function () { step.classList.remove('on'); }
      });
    });
  }

  /* ---------- Footer wordmark: wipes up with a gold gradient ---------- */

  var mark = document.querySelector('.footer-mark');
  if (mark) {
    gsap.fromTo(mark,
      { clipPath: 'inset(100% 0% 0% 0%)', y: 30 },
      {
        clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.4, ease: 'power4.out',
        scrollTrigger: { trigger: mark, start: 'top 90%', once: true }
      });
  }

  /* ---------- Pointer effects (fine pointers only) ---------- */

  if (fine) {
    gsap.utils.toArray('.actions .btn-gold, .float-call').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', function (event) {
        var r = el.getBoundingClientRect();
        xTo((event.clientX - (r.left + r.width / 2)) * 0.22);
        yTo((event.clientY - (r.top + r.height / 2)) * 0.28);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });

    gsap.utils.toArray('[data-tilt]').forEach(function (el) {
      gsap.set(el, { transformPerspective: 900, transformOrigin: 'center' });
      var rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
      var ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', function (event) {
        var r = el.getBoundingClientRect();
        var px = (event.clientX - r.left) / r.width - 0.5;
        var py = (event.clientY - r.top) / r.height - 0.5;
        ry(px * 12);
        rx(-py * 10);
      });
      el.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  }

  /* ---------- 3D globe, pinned hero, scroll-driven route ---------- */

  var hero = document.querySelector('.act-arrival');
  var stage = document.querySelector('[data-stage]');

  function mountGlobe() {
    var moduleUrl = new URL('globe.js', base).href;
    var dotsUrl = new URL('globe-dots.json', base).href;
    import(moduleUrl)
      .then(function (module) { return module.mountGlobe(stage, { dots: dotsUrl }); })
      .then(function (globe) {
        stage.classList.add('is-live');
        if (wide) {
          // Desktop: the hero pins and the route is drawn as you scroll through it.
          ST.create({
            trigger: hero,
            start: 'top top',
            end: '+=130%',
            pin: true,
            scrub: 0.5,
            onUpdate: function (self) { globe.setProgress(self.progress); }
          });
        } else {
          // Phone: no pin (it would trap scrolling). The route is drawn as the globe passes the screen.
          ST.create({
            trigger: stage,
            start: 'top 85%',
            end: 'bottom 35%',
            scrub: 0.5,
            onUpdate: function (self) { globe.setProgress(self.progress); }
          });
        }
        ST.refresh();
      })
      .catch(function () {
        // No WebGL or the module failed: keep the flat route map. Nothing is pinned.
      });
  }

  if (hero && stage) mountGlobe();

  /* ---------- Refresh after layout changes ---------- */

  document.addEventListener('sitelangchange', function () { ST.refresh(); });
  window.addEventListener('load', function () { ST.refresh(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ST.refresh(); });
  }
})();

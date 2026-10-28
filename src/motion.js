/*!
 * motion.js: the animation layer for the Ribeira Materiais demo site.
 * Vanilla JS, no libraries. Loaded in <head> (not deferred) so it can mark
 * <html class="mo"> before first paint; it never touches booking, enquiry,
 * language or tracking code, and switches itself off with
 * prefers-reduced-motion or on any error. Styles: motion.css.
 */
(function () {
  /* ── Motion core: the same small engine on every demo site ──────────────
     Progressive enhancement: this file runs in <head>. Only when the browser
     can animate (and the visitor has not asked for reduced motion) does it add
     .mo to <html>, and only then is anything hidden-until-revealed. Without JS,
     with reduced motion, or if anything here throws, the page is the page. */
  'use strict';
  var doc = document, root = doc.documentElement, W = window;
  var mm = function (q) { try { return W.matchMedia(q).matches; } catch (e) { return false; } };
  var REDUCE = mm('(prefers-reduced-motion: reduce)');
  var CAN = 'IntersectionObserver' in W && 'requestAnimationFrame' in W && typeof Element !== 'undefined' &&
    'animate' in Element.prototype && W.CSS && CSS.supports && CSS.supports('translate', '1px') && CSS.supports('clip-path', 'inset(0)');
  var ON = !!(CAN && !REDUCE);
  var FINE = mm('(hover: hover) and (pointer: fine)');
  var EASE = 'cubic-bezier(.16, 1, .3, 1)';      // expo out: fast, then a long settle
  var EASE_IO = 'cubic-bezier(.65, 0, .35, 1)';  // in-out for travelling things
  var SPRING = 'cubic-bezier(.34, 1.56, .64, 1)'; // a little overshoot
  var inited = false;
  var SVGNS = 'http://www.w3.org/2000/svg';

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function outExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function svg(markup) {
    var t = doc.createElement('template');
    t.innerHTML = markup.trim();
    return t.content.firstElementChild;
  }

  /* Reveal variants: keyframes for the Web Animations API. They use the
     individual translate / scale / rotate properties and clip-path, so they
     never fight a site's own `transform` hovers or `transition` lists. */
  var V = {
    rise: [{ opacity: 0, translate: '0 42px' }, { opacity: 1, translate: '0 0' }],
    riseSm: [{ opacity: 0, translate: '0 18px' }, { opacity: 1, translate: '0 0' }],
    fade: [{ opacity: 0 }, { opacity: 1 }],
    left: [{ opacity: 0, translate: '-56px 0' }, { opacity: 1, translate: '0 0' }],
    right: [{ opacity: 0, translate: '56px 0' }, { opacity: 1, translate: '0 0' }],
    zoom: [{ opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }],
    pop: [{ opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }],
    blur: [{ opacity: 0, filter: 'blur(14px)', translate: '0 14px' }, { opacity: 1, filter: 'blur(0px)', translate: '0 0' }],
    tilt: [{ opacity: 0, translate: '0 64px', rotate: '-2.5deg' }, { opacity: 1, translate: '0 0', rotate: '0deg' }],
    tiltR: [{ opacity: 0, translate: '0 64px', rotate: '2.5deg' }, { opacity: 1, translate: '0 0', rotate: '0deg' }],
    wipe: [{ opacity: 1, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0% 0 0)' }],
    wipeL: [{ opacity: 1, clipPath: 'inset(0 0 0 100%)' }, { opacity: 1, clipPath: 'inset(0 0 0 0%)' }],
    wipeUp: [{ opacity: 1, clipPath: 'inset(100% 0 0 0)', translate: '0 24px' }, { opacity: 1, clipPath: 'inset(0% 0 0 0)', translate: '0 0' }],
    wipeDown: [{ opacity: 1, clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, clipPath: 'inset(0 0 0% 0)' }],
    curtain: [{ opacity: 1, clipPath: 'inset(10% 10% 10% 10% round 28px)', scale: 1.06 }, { opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 0px)', scale: 1 }],
    iris: [{ opacity: 1, clipPath: 'circle(0% at 50% 50%)' }, { opacity: 1, clipPath: 'circle(75% at 50% 50%)' }],
  };

  /* ── Reveal on scroll ── */
  var io = null;
  function reveal(el, v, delay, dur) {
    if (!el || el.__moDone) return null;
    el.__moDone = true;
    el.classList.add('mo-in');
    var kf = typeof v === 'function' ? v(el) : (V[v] || V.rise);
    var a = null;
    try { a = el.animate(kf, { duration: dur || 1000, delay: delay || 0, easing: EASE, fill: 'backwards' }); } catch (e) { /* shown anyway */ }
    if (el.__moThen) { try { el.__moThen(el, delay || 0); } catch (e) { /* decoration only */ } }
    return a;
  }
  function watch(el, v, opts) {
    opts = opts || {};
    if (!el || el.__moWatched) return;
    el.__moWatched = true;
    el.__moV = v; el.__moDelay = opts.delay || 0; el.__moDur = opts.dur; el.__moStagger = opts.stagger == null ? 90 : opts.stagger;
    if (opts.then) el.__moThen = opts.then;
    if (io) io.observe(el); else reveal(el, v);
  }
  function startIO() {
    io = new IntersectionObserver(function (entries) {
      var hits = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      hits.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
      var n = 0;
      hits.forEach(function (el) {
        io.unobserve(el);
        reveal(el, el.__moV, el.__moDelay + n * el.__moStagger, el.__moDur);
        n++;
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
  }

  /* ── Words: a headline rises word by word, each from behind its own mask.
     The spans stay (no reflow at the end); a language switch that rewrites
     the element simply drops them. ── */
  function splitWords(el) {
    var words = [];
    var walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (!/\S/.test(node.nodeValue)) return;
      var frag = doc.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(part)); return; }
        var w = doc.createElement('span'); w.className = 'mo-w';
        var i = doc.createElement('span'); i.className = 'mo-wi'; i.textContent = part;
        w.appendChild(i); frag.appendChild(w); words.push(i);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return words;
  }
  function words(el, delay, step) {
    if (!el) return 0;
    var ws = splitWords(el);
    el.classList.add('mo-in');
    el.__moDone = true;
    ws.forEach(function (w, i) {
      w.animate([{ translate: '0 115%', rotate: '4deg' }, { translate: '0 0', rotate: '0deg' }],
        { duration: 1100, delay: delay + i * (step || 70), easing: EASE, fill: 'backwards' });
    });
    var end = delay + ws.length * (step || 70) + 1100;
    setTimeout(function () { el.classList.add('mo-wdone'); }, end);
    return end;
  }

  /* ── Counters: the first number in an element counts up to itself. Only
     that text node changes, and it always ends on the exact original text.
     If anything else rewrites it meanwhile (a language switch), we stop. ── */
  function count(el, dur, delay) {
    if (!el || el.__moCounted) return;
    el.__moCounted = true;
    var walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), node = null;
    while (walker.nextNode()) { if (/\d/.test(walker.currentNode.nodeValue)) { node = walker.currentNode; break; } }
    if (!node) return;
    var orig = node.nodeValue;
    var m = orig.match(/\d[\d.,]*/);
    if (!m) return;
    var tok = m[0].replace(/[.,]$/, '');
    var thou = /^\d{1,3}([.,]\d{3})+$/.test(tok) ? tok.charAt(tok.search(/[.,]/)) : '';
    var dec = !thou && /[.,]/.test(tok) ? tok.charAt(tok.search(/[.,]/)) : '';
    var digits = dec ? tok.split(dec)[1].length : 0;
    var target = parseFloat(thou ? tok.split(thou).join('') : dec ? tok.replace(dec, '.') : tok);
    if (!isFinite(target) || target === 0) return;
    var pre = orig.slice(0, m.index), post = orig.slice(m.index + tok.length);
    function fmt(v) {
      var s = v.toFixed(digits);
      if (dec) s = s.replace('.', dec);
      if (thou) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, thou);
      return pre + s + post;
    }
    var last = fmt(0), t0 = null;
    node.nodeValue = last;
    dur = dur || 1400;
    function step(t) {
      if (!node.isConnected || node.nodeValue !== last) return; // someone else wrote here
      if (t0 === null) t0 = t + (delay || 0);
      var p = clamp((t - t0) / dur, 0, 1);
      last = p >= 1 ? orig : fmt(target * outExpo(p));
      node.nodeValue = last;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ── Scroll-linked work, batched into one rAF per frame ── */
  var scrollFns = [], ticking = false;
  function onScroll(fn) { scrollFns.push(fn); }
  function tick() {
    ticking = false;
    var vh = W.innerHeight || root.clientHeight, vw = root.clientWidth;
    for (var i = 0; i < scrollFns.length; i++) { try { scrollFns[i](vh, vw); } catch (e) { /* keep the others going */ } }
  }
  function kick() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
  /** 0 when the element's top is at a·vh, 1 when it is at b·vh. */
  function enter(el, a, b, vh) { var r = el.getBoundingClientRect(); return clamp((vh * a - r.top) / (vh * (a - b)), 0, 1); }
  /** 0 when the element enters at the bottom, 1 when it leaves at the top. */
  function through(el, vh) { var r = el.getBoundingClientRect(); return clamp((vh - r.top) / (vh + r.height), 0, 1); }
  function visible(el, vh) { var r = el.getBoundingClientRect(); return r.bottom > -80 && r.top < vh + 80; }

  /* A band (usually a dark section) that opens out to full width as it comes in. */
  function band(el) {
    if (!el) return;
    onScroll(function (vh, vw) {
      var p = enter(el, 1.02, 0.55, vh);
      if (p >= 1) { if (el.style.clipPath) el.style.clipPath = ''; return; }
      var m = (1 - outExpo(p)) * Math.min(56, vw * 0.03), r = (1 - p) * 36;
      el.style.clipPath = 'inset(0 ' + m.toFixed(1) + 'px round ' + r.toFixed(1) + 'px)';
    });
  }

  /* Parallax: moves an element by `k` px per px its parent scrolls. */
  function parallax(el, k, ref) {
    if (!el) return;
    ref = ref || el.parentElement || el;
    onScroll(function (vh) {
      if (!visible(ref, vh)) return;
      var r = ref.getBoundingClientRect();
      var c = r.top + r.height / 2 - vh / 2;
      el.style.translate = '0 ' + (-c * k).toFixed(1) + 'px';
    });
  }

  /* ── Smooth, eased anchor scrolling that respects the sticky header ── */
  function headerOffset() {
    var sp = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    var h = 0;
    $$('header, .nav, .top').forEach(function (el) {
      var cs = getComputedStyle(el);
      if (cs.position === 'sticky' || cs.position === 'fixed') h = Math.max(h, el.offsetHeight);
    });
    return Math.max(sp, h + 12);
  }
  var scrollAnim = null;
  function scrollToY(y, cb) {
    var start = W.scrollY, dist = y - start, t0 = null;
    var dur = clamp(Math.abs(dist) * 0.45, 450, 1150);
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    var stop = function () { scrollAnim = null; root.style.scrollBehavior = prev; W.removeEventListener('wheel', stop); W.removeEventListener('touchstart', stop); };
    W.addEventListener('wheel', stop, { passive: true });
    W.addEventListener('touchstart', stop, { passive: true });
    var id = {};
    scrollAnim = id;
    function step(t) {
      if (scrollAnim !== id) return;
      if (t0 === null) t0 = t;
      var p = clamp((t - t0) / dur, 0, 1);
      W.scrollTo(0, start + dist * inOut(p));
      if (p < 1) requestAnimationFrame(step); else { stop(); if (cb) cb(); }
    }
    requestAnimationFrame(step);
  }
  function smoothAnchors() {
    doc.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href*="#"]');
      if (!a || a.target === '_blank') return;
      var url;
      try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
      var id = decodeURIComponent(url.hash.slice(1));
      if (!id) return;
      var target = doc.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var y = target.getBoundingClientRect().top + W.scrollY - headerOffset();
      scrollToY(Math.max(0, y), function () {
        try { history.pushState(null, '', '#' + id); } catch (err) { /* file:// */ }
        if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
        try { target.focus({ preventScroll: true }); } catch (err) { /* old browser */ }
      });
    });
  }

  /* ── Hover and press micro-interactions (desktop pointers only for hover) ── */
  function magnetic(sel, strength) {
    if (!FINE) return;
    $$(sel).forEach(function (el) {
      var x = 0, y = 0, tx = 0, ty = 0, raf = 0;
      function loop() {
        x = lerp(x, tx, 0.18); y = lerp(y, ty, 0.18);
        el.style.translate = x.toFixed(2) + 'px ' + y.toFixed(2) + 'px';
        if (Math.abs(x - tx) > 0.05 || Math.abs(y - ty) > 0.05) raf = requestAnimationFrame(loop);
        else { raf = 0; if (!tx && !ty) el.style.translate = ''; }
      }
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        tx = (e.clientX - r.left - r.width / 2) * (strength || 0.22);
        ty = (e.clientY - r.top - r.height / 2) * (strength || 0.22) * 1.3;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
    });
  }
  function press(sel) {
    doc.addEventListener('pointerdown', function (e) {
      var el = e.target.closest && e.target.closest(sel);
      if (!el) return;
      try { el.animate([{ scale: 1 }, { scale: 0.95 }, { scale: 1 }], { duration: 380, easing: EASE }); } catch (err) { /* fine */ }
    });
  }
  /* A soft light that follows the pointer across a card (CSS reads --mx/--my). */
  function spotlight(sel) {
    if (!FINE) return;
    doc.addEventListener('pointermove', function (e) {
      var el = e.target.closest && e.target.closest(sel);
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }, { passive: true });
  }

  /* Draw an SVG stroke: from nothing to whole. */
  function draw(path, dur, delay, ease) {
    if (!path) return null;
    path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1 3';
    var a = path.animate([{ strokeDashoffset: 1.02 }, { strokeDashoffset: 0 }], { duration: dur || 1400, delay: delay || 0, easing: ease || EASE_IO, fill: 'both' });
    return a;
  }

  /* ── Boot ── */
  var hideCss = [];
  function hide(sel) { hideCss.push('html.mo ' + sel + ':not(.mo-in)'); }
  function boot(cfg) {
    // Before first paint: what will be revealed starts hidden.
    if (ON) {
      root.classList.add('mo');
      (cfg.reveal || []).forEach(function (r) { hide(r[0]); });
      (cfg.hero || []).forEach(function (r) { hide(r[0]); });
      var st = doc.createElement('style');
      st.setAttribute('data-motion', '');
      st.textContent = hideCss.join(',\n') + ' { opacity: 0; }\n@media print { html.mo * { opacity: 1 !important; } }';
      (doc.head || root).appendChild(st);
      // If the page never gets as far as init, give the content back.
      setTimeout(function () { if (!inited) root.classList.remove('mo'); }, 5000);
    } else {
      root.classList.add(REDUCE ? 'mo-reduce' : 'mo-off');
    }
    function init() {
      if (inited) return;
      inited = true;
      try {
        if (ON) {
          startIO();
          (cfg.reveal || []).forEach(function (r) {
            $$(r[0]).forEach(function (el) { watch(el, r[1], r[2]); });
          });
          (cfg.counters || []).forEach(function (c) {
            $$(c[0]).forEach(function (el) {
              var prev = el.__moThen;
              if (el.__moWatched) {
                el.__moThen = function (x, d) { if (prev) prev(x, d); count(x, c[1], d + (c[2] || 150)); };
              } else {
                var cio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { cio.disconnect(); count(el, c[1], c[2] || 0); } }); }, { rootMargin: '0px 0px -10% 0px' });
                cio.observe(el);
              }
            });
          });
          (cfg.bands || []).forEach(function (s) { $$(s).forEach(band); });
          smoothAnchors();
          if (cfg.magnetic) magnetic(cfg.magnetic, cfg.magneticStrength);
          if (cfg.press) press(cfg.press);
          if (cfg.spotlight) spotlight(cfg.spotlight);
          W.addEventListener('scroll', kick, { passive: true });
          W.addEventListener('resize', kick, { passive: true });
        }
        if (cfg.site) cfg.site({ ON: ON, REDUCE: REDUCE });
        if (ON) {
          var go = function () {
            if (go.done) return; go.done = true;
            (cfg.hero || []).forEach(function (h) {
              var el = $(h[0]);
              if (!el) return;
              if (h[1] === 'words') words(el, h[2] || 0, h[3]);
              else reveal(el, h[1], h[2] || 0, h[3]);
            });
            if (cfg.afterHero) cfg.afterHero();
            kick();
          };
          // Wait (briefly) for the web fonts so the headline does not reflow mid-animation.
          if (doc.fonts && doc.fonts.ready) { doc.fonts.ready.then(go, go); setTimeout(go, 450); } else go();
        }
      } catch (err) {
        root.classList.remove('mo');
        if (W.console && console.warn) console.warn('motion: switched off', err);
      }
    }
    // After every other DOMContentLoaded handler (language, booking, listings).
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
    else setTimeout(init, 0);
  }

  /* ── Ribeira Materiais: a delivery van drives the route as you scroll
     through "how deliveries work"; each drop pin pops as the van reaches it ── */
  var ROUTE_D = 'M0 52 C 50 52, 70 66, 125 66 S 320 34, 375 34 S 570 66, 625 66 S 820 34, 875 34 S 960 50, 1000 50';
  var PINS_X = [125, 375, 625, 875];

  function routeScene(on) {
    var list = $('#entregas ol.steps');
    if (!list || $('.mo-route')) return null;
    var box = doc.createElement('div');
    box.className = 'mo-route mo-deco';
    box.setAttribute('aria-hidden', 'true');
    var pins = PINS_X.map(function (x, i) {
      return '<span class="mo-pin" style="left:' + (x / 10) + '%;top:' + (i % 2 ? 34 : 66) + '%"><i class="mo-pin-ring"></i>' +
        '<svg viewBox="0 0 28 36" focusable="false"><path d="M14 0C6.3 0 0 6 0 13.6 0 24 14 36 14 36s14-12 14-22.4C28 6 21.7 0 14 0z" fill="#B4532A"/><circle cx="14" cy="13.5" r="8" fill="#FBF8F4"/>' +
        '<text x="14" y="18" text-anchor="middle" font-size="12" font-weight="800" fill="#1F2421">' + (i + 1) + '</text></svg></span>';
    }).join('');
    box.innerHTML = '<svg class="mo-road" viewBox="0 0 1000 100" preserveAspectRatio="none" focusable="false">' +
      '<path d="' + ROUTE_D + '" fill="none" stroke="#343A36" stroke-width="16" stroke-linecap="round"/>' +
      '<path d="' + ROUTE_D + '" fill="none" stroke="#5B625D" stroke-width="1.5" stroke-dasharray="10 12"/>' +
      '<path class="mo-trail" d="' + ROUTE_D + '" fill="none" stroke="#F0B48F" stroke-width="4" stroke-linecap="round"/>' +
      '</svg>' +
      '<span class="mo-depot"><svg viewBox="0 0 30 26" focusable="false"><path d="M2 12 15 3l13 9v12H2z" fill="#3B413D" stroke="#F0B48F" stroke-width="1.6" stroke-linejoin="round"/><rect x="10" y="15" width="10" height="9" fill="#F0B48F"/></svg></span>' +
      pins +
      '<span class="mo-van"><svg viewBox="0 0 76 42" focusable="false">' +
      '<rect x="2" y="5" width="48" height="26" rx="3" fill="#B4532A"/>' +
      '<rect x="7" y="17" width="38" height="3" rx="1.5" fill="#F0B48F"/>' +
      '<path d="M50 11h13.5c1 0 1.9.5 2.4 1.3l6.6 9.7c.3.5.5 1 .5 1.6V31H50z" fill="#8F3F1E"/>' +
      '<path d="M54 14h8.6l5.4 8H54z" fill="#CFE3EE"/>' +
      '<rect x="0" y="29" width="74" height="4" rx="2" fill="#1F2421"/>' +
      '<g class="mo-wheel" transform="translate(16 33)"><circle r="7" fill="#1F2421"/><circle r="3" fill="#D9DCD8"/><path d="M0 -6V6M-6 0H6" stroke="#8A918C" stroke-width="1.2"/></g>' +
      '<g class="mo-wheel" transform="translate(60 33)"><circle r="7" fill="#1F2421"/><circle r="3" fill="#D9DCD8"/><path d="M0 -6V6M-6 0H6" stroke="#8A918C" stroke-width="1.2"/></g>' +
      '</svg></span>';
    list.parentNode.insertBefore(box, list);
    var road = $('.mo-road', box), trail = $('.mo-trail', box);
    var path = road.querySelector('path');
    var len = path.getTotalLength();
    // Where along the route each pin sits (by x), as a fraction of its length.
    var fr = PINS_X.map(function (px) {
      var best = 0, bd = 1e9;
      for (var i = 0; i <= 400; i++) { var pt = path.getPointAtLength(len * i / 400); var d = Math.abs(pt.x - px); if (d < bd) { bd = d; best = i / 400; } }
      return best;
    });
    trail.setAttribute('pathLength', '1');
    trail.style.strokeDasharray = '1 2';
    var R = { box: box, path: path, len: len, fr: fr, trail: trail, van: $('.mo-van', box), wheels: $$('.mo-wheel', box), pins: $$('.mo-pin', box),
      steps: $$('#entregas ol.steps > li'), cur: 0, goal: 0, reached: -1 };
    if (!on) { place(R, 1); R.pins.forEach(function (p) { p.classList.add('on'); }); }
    else place(R, 0);
    return R;
  }

  function place(R, p) {
    var W = R.box.clientWidth, H = R.box.clientHeight;
    var at = R.len * clamp(p, 0, 1);
    var a = R.path.getPointAtLength(Math.max(0, at - 4)), b = R.path.getPointAtLength(Math.min(R.len, at + 4));
    var pt = R.path.getPointAtLength(at);
    var x = pt.x / 1000 * W, y = pt.y / 100 * H;
    var ang = Math.atan2((b.y - a.y) / 100 * H, (b.x - a.x) / 1000 * W) * 180 / Math.PI;
    R.van.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%, -86%) rotate(' + ang.toFixed(1) + 'deg)';
    R.trail.style.strokeDashoffset = String(1 - clamp(p, 0, 1));
    var spin = 'rotate(' + (p * W * 1.6).toFixed(0) + ')';
    R.wheels.forEach(function (w, i) { w.setAttribute('transform', 'translate(' + (i ? 60 : 16) + ' 33) ' + spin); });
    for (var i = 0; i < R.fr.length; i++) {
      if (p >= R.fr[i] - 0.004 && i > R.reached) {
        R.reached = i;
        var pin = R.pins[i];
        pin.classList.add('on');
        try { pin.animate([{ scale: 0, translate: '0 -18px' }, { scale: 1.25, translate: '0 0', offset: 0.6 }, { scale: 1 }], { duration: 650, easing: 'cubic-bezier(.3,1.5,.5,1)' }); } catch (e) { /* fine */ }
        if (R.steps[i]) R.steps[i].classList.add('mo-reached');
      }
    }
  }

  boot({
    hero: [
      ['.hero .kicker', 'riseSm', 150, 800],
      ['.hero h1', 'words', 260, 75],
      ['.hero .lead', 'blur', 700, 1000],
      ['.hero .cta-row', 'riseSm', 880],
      ['.hero .live-card', function () { return [{ opacity: 0, translate: '70px 0', rotate: '3deg' }, { opacity: 1, translate: '0 0', rotate: '0deg' }]; }, 600, 1300],
    ],
    reveal: [
      ['.facts-in > div', 'wipe', { stagger: 120, dur: 1100 }],
      ['#produtos .head', 'rise'],
      ['.cats > .cat', function (el) { return Array.prototype.indexOf.call(el.parentNode.children, el) % 2 ? V.tiltR : V.tilt; }, { stagger: 90, then: function (el, d) {
        var img = el.querySelector('img');
        if (img) img.animate([{ scale: 1.2 }, { scale: 1 }], { duration: 1600, delay: d, easing: EASE, fill: 'backwards' });
      } }],
      ['#entregas .head', 'rise'],
      ['#entregas .steps > li', 'riseSm', { stagger: 120 }],
      ['.track > div:first-child', 'left'],
      ['.track .phone', function () { return [{ opacity: 0, translate: '0 90px', rotate: '7deg' }, { opacity: 1, translate: '0 0', rotate: '0deg' }]; }, { dur: 1300 }],
      ['.order > div:first-child', 'left'],
      ['.order .ticks > li', 'left', { stagger: 90 }],
      ['.order .form', 'riseSm', { delay: 120 }],
      ['.contact > div', 'rise'],
      ['.contact > img', 'curtain', { dur: 1400 }],
      ['.foot-in', 'fade'],
    ],
    counters: [['.cat .price', 1100, 250]],
    bands: ['#entregas'],
    magnetic: '.hero .btn-lg, .track .btn-lg',
    press: '.btn, .lang button',
    spotlight: '.cat',
    site: function (m) {
      var R = routeScene(m.ON);
      if (!m.ON) return;
      var img = $('.hero-img');
      if (img) img.animate([{ scale: 1.16 }, { scale: 1 }], { duration: 2800, easing: EASE });
      // The live card's progress bars fill in order: loaded, on the way.
      $$('.live-steps .on').forEach(function (s, i) {
        s.animate([{ borderTopColor: '#E6DED3' }, { borderTopColor: '#E6DED3', offset: 0.3 }, { borderTopColor: '#B4532A' }], { duration: 900, delay: 1500 + i * 450, easing: 'ease-out', fill: 'backwards' });
      });
      var hero = $('.hero'), phone = $('.track .phone'), raf = 0;
      function glide() {
        raf = 0;
        R.cur = lerp(R.cur, R.goal, 0.12);
        if (Math.abs(R.cur - R.goal) < 0.0005) R.cur = R.goal;
        place(R, R.cur);
        if (R.cur !== R.goal) raf = requestAnimationFrame(glide);
      }
      onScroll(function (vh) {
        if (hero && img && visible(hero, vh)) img.style.translate = '0 ' + (W.scrollY * 0.3).toFixed(1) + 'px';
        if (R && visible(R.box, vh)) {
          R.goal = enter(R.box, 0.95, 0.3, vh);
          if (!raf) raf = requestAnimationFrame(glide);
        }
        if (phone && visible(phone, vh)) phone.style.rotate = ((through(phone, vh) - 0.5) * -6).toFixed(2) + 'deg';
      });
      W.addEventListener('resize', function () { if (R) place(R, R.cur); }, { passive: true });
    },
  });
})();

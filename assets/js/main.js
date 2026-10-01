/* ============================================================
   VIDHI AGARWAL — "The Ledger"
   Vanilla JS. No dependencies, no build step.
   ============================================================ */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE    = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ----------------------------------------------------------
     1. Split the hero name into animatable characters
     ---------------------------------------------------------- */
  (function splitName() {
    var lines = $$('.hero__line');
    var i = 0;
    var gradientLines = [];
    lines.forEach(function (line) {
      var text = line.getAttribute('data-text') || '';
      var frag = document.createDocumentFragment();
      text.split('').forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'hero__ch' + (ch === ' ' ? ' hero__ch--space' : '');
        s.style.setProperty('--i', i++);
        s.textContent = ch === ' ' ? ' ' : ch;
        frag.appendChild(s);
      });
      line.appendChild(frag);
      if (line.classList.contains('hero__line--accent')) gradientLines.push(line);
    });

    /* Each character carries its own copy of the gradient — a transformed child
       breaks background-clip:text on its parent. Offsetting each background by
       the character's own position stitches them into one continuous sweep.
       offsetLeft is layout-based, so the entry transform doesn't skew it. */
    function stitch() {
      gradientLines.forEach(function (line) {
        var chars = $$('.hero__ch', line);
        if (!chars.length) return;
        var last = chars[chars.length - 1];
        var span = last.offsetLeft + last.offsetWidth;
        chars.forEach(function (s) {
          s.style.backgroundSize = span + 'px 100%';
          s.style.backgroundPosition = (-s.offsetLeft) + 'px 0';
        });
      });
    }

    stitch();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(stitch);

    var t = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(t);
      t = window.setTimeout(stitch, 150);
    });
  })();

  /* ----------------------------------------------------------
     2. Preloader
     ---------------------------------------------------------- */
  (function preloader() {
    var loader = $('#loader');
    var fill   = $('#loaderFill');
    var pct    = $('#loaderPct');

    function finish() {
      if (!document.body.classList.contains('is-loading')) return;
      document.body.classList.remove('is-loading');
      document.dispatchEvent(new CustomEvent('va:loaded'));
      if (!loader) return;
      loader.classList.add('is-done');
      window.setTimeout(function () {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 800);
    }

    /* no loader markup — don't strand the page behind is-loading */
    if (!loader) { finish(); return; }

    var DURATION = REDUCED ? 200 : 1150;
    var start    = performance.now();

    function step(now) {
      var p = Math.min((now - start) / DURATION, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(eased * 100);
      if (fill) fill.style.width = val + '%';
      if (pct) pct.textContent = val < 10 ? '0' + val : String(val);
      if (p < 1) { requestAnimationFrame(step); } else { finish(); }
    }
    requestAnimationFrame(step);

    /* hard safety net — never trap the page behind the loader */
    window.setTimeout(function () {
      if (document.body.classList.contains('is-loading')) finish();
    }, 3500);
  })();

  /* ----------------------------------------------------------
     3. Theme
     ---------------------------------------------------------- */
  (function theme() {
    var root   = document.documentElement;
    var toggle = $('#themeToggle');
    var meta   = document.querySelector('meta[name="theme-color"]');
    var stored = null;

    try { stored = localStorage.getItem('va-theme'); } catch (e) {}

    if (!stored && window.matchMedia('(prefers-color-scheme: light)').matches) stored = 'light';
    if (stored) root.setAttribute('data-theme', stored);
    paint();

    function paint() {
      if (!meta) return;
      meta.setAttribute('content', root.getAttribute('data-theme') === 'light' ? '#F5F1E8' : '#070A0F');
    }

    if (toggle) {
      toggle.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('va-theme', next); } catch (e) {}
        paint();
      });
    }
  })();

  /* ----------------------------------------------------------
     4. Navigation — sticky state, mobile menu, active section
     ---------------------------------------------------------- */
  (function nav() {
    var bar    = $('#nav');
    var links  = $('#navLinks');
    var burger = $('#burger');

    function closeMenu() {
      if (!links) return;
      links.classList.remove('is-open');
      if (burger) {
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Open menu');
      }
      document.body.classList.remove('is-locked');
    }

    if (burger && links) {
      burger.addEventListener('click', function () {
        var open = links.classList.toggle('is-open');
        burger.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.classList.toggle('is-locked', open);
      });
      $$('.nav__link', links).forEach(function (a) {
        a.addEventListener('click', closeMenu);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('scroll', function () {
      if (bar) bar.classList.toggle('is-stuck', window.scrollY > 24);
    }, { passive: true });

    /* active link */
    var navLinks = $$('.nav__link');
    var sections = navLinks
      .map(function (a) { return $(a.getAttribute('href')); })
      .filter(Boolean);

    if ('IntersectionObserver' in window && sections.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          navLinks.forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id);
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      sections.forEach(function (s) { io.observe(s); });
    }
  })();

  /* ----------------------------------------------------------
     5. Scroll progress + back to top
     ---------------------------------------------------------- */
  (function scrollUi() {
    var bar   = $('#scrollBar');
    var toTop = $('#toTop');

    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? (window.scrollY / max) * 100 : 0;
      if (bar) bar.style.width = p + '%';
      if (toTop) toTop.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.7);
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
      });
    }
  })();

  /* ----------------------------------------------------------
     6. Reveal on scroll
     ---------------------------------------------------------- */
  (function reveal() {
    var items = $$('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || REDUCED) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    function start() {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en, i) {
          if (!en.isIntersecting) return;
          var el = en.target;
          window.setTimeout(function () { el.classList.add('is-in'); }, i * 70);
          obs.unobserve(el);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

      items.forEach(function (el) { io.observe(el); });
    }

    /* hold the reveals until the preloader lifts, so the hero animates
       in front of the visitor rather than behind the loading screen */
    if (document.body.classList.contains('is-loading')) {
      document.addEventListener('va:loaded', start, { once: true });
    } else {
      start();
    }
  })();

  /* ----------------------------------------------------------
     7. Cursor + spotlight
     ---------------------------------------------------------- */
  (function pointer() {
    if (!FINE || REDUCED) return;

    var dot   = $('#cursorDot');
    var ring  = $('#cursorRing');
    var spot  = $('#spotlight');
    var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    var rx = tx, ry = ty;

    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (dot) dot.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
      if (spot) {
        /* position:fixed — viewport coords, no scroll offset */
        spot.style.left = tx + 'px';
        spot.style.top = ty + 'px';
        spot.style.opacity = '1';
      }
    }, { passive: true });

    (function loop() {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      if (ring) ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(loop);
    })();

    var hot = 'a, button, .card, .chip, .acc__head, input, .ledger, .stat, .crow';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(hot) && ring) ring.classList.add('is-hot');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(hot) && ring) ring.classList.remove('is-hot');
    });
  })();

  /* ----------------------------------------------------------
     8. Hero canvas — drifting ledger constellation
     ---------------------------------------------------------- */
  (function heroCanvas() {
    var cv = $('#heroCanvas');
    if (!cv || REDUCED) return;

    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, dots = [];
    var mouse = { x: -9999, y: -9999 };
    var raf = null, visible = true;

    function palette() {
      return document.documentElement.getAttribute('data-theme') === 'light'
        ? { dot: '162,105,26', line: '162,105,26', a: 0.5, la: 0.16 }
        : { dot: '232,185,97', line: '232,185,97', a: 0.55, la: 0.13 };
    }

    function size() {
      var r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      var target = Math.min(72, Math.round((w * h) / 17000));
      dots = [];
      for (var i = 0; i < target; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          r: Math.random() * 1.5 + 0.5
        });
      }
    }

    function frame() {
      var p = palette();
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.vx; d.y += d.vy;
        if (d.x < -20) d.x = w + 20; if (d.x > w + 20) d.x = -20;
        if (d.y < -20) d.y = h + 20; if (d.y > h + 20) d.y = -20;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.dot + ',' + p.a + ')';
        ctx.fill();

        for (var j = i + 1; j < dots.length; j++) {
          var o = dots[j];
          var dx = d.x - o.x, dy = d.y - o.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 128) {
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(o.x, o.y);
            ctx.strokeStyle = 'rgba(' + p.line + ',' + (p.la * (1 - dist / 128)) + ')';
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }

        var mx = d.x - mouse.x, my = d.y - mouse.y;
        var md = Math.sqrt(mx * mx + my * my);
        if (md < 170) {
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = 'rgba(' + p.line + ',' + (0.22 * (1 - md / 170)) + ')';
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', size);
    cv.addEventListener('mousemove', function (e) {
      var r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    }, { passive: true });
    cv.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999; });

    /* pause when the hero scrolls out of view */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          visible = en.isIntersecting;
          if (visible && !raf) { raf = requestAnimationFrame(frame); }
          else if (!visible && raf) { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0 }).observe(cv);
    }

    size();
    raf = requestAnimationFrame(frame);
  })();

  /* ----------------------------------------------------------
     9. Rotating role typewriter
     ---------------------------------------------------------- */
  (function roles() {
    var el = $('#roleText');
    if (!el) return;

    var list = [
      'accounting & finance',
      'Tally Prime & GST working',
      'advanced Excel & MIS reporting',
      'bookkeeping & reconciliation',
      'month-end close & documentation'
    ];

    if (REDUCED) { el.textContent = list[0]; return; }

    var i = 0, c = 0, deleting = false;

    function tick() {
      var word = list[i];
      c += deleting ? -1 : 1;
      el.textContent = word.slice(0, c);

      var delay = deleting ? 34 : 62;
      if (!deleting && c === word.length) { delay = 1900; deleting = true; }
      else if (deleting && c === 0) { deleting = false; i = (i + 1) % list.length; delay = 260; }
      window.setTimeout(tick, delay);
    }
    window.setTimeout(tick, 1500);
  })();

  /* ----------------------------------------------------------
     10. Count-up numbers
     ---------------------------------------------------------- */
  var groupIN = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

  (function counters() {
    var nodes = $$('[data-count]');
    if (!nodes.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var plain  = el.hasAttribute('data-plain');
      if (REDUCED) {
        el.textContent = plain ? String(target) : groupIN.format(target);
        return;
      }
      var dur = 1400, t0 = null;
      function step(now) {
        if (!t0) t0 = now;
        var p = Math.min((now - t0) / dur, 1);
        var v = Math.round(target * (1 - Math.pow(1 - p, 4)));
        el.textContent = plain ? String(v) : groupIN.format(v);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) { nodes.forEach(run); return; }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var delay = en.target.closest('.ledger') ? 750 : 0;
        window.setTimeout(function () { run(en.target); }, delay);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.35 });

    nodes.forEach(function (el) { io.observe(el); });
  })();

  /* ----------------------------------------------------------
     11. Accordion
     ---------------------------------------------------------- */
  (function accordion() {
    var items = $$('.acc');
    if (!items.length) return;

    items.forEach(function (item) {
      var head  = $('.acc__head', item);
      var panel = $('.acc__panel', item);
      if (!head || !panel) return;

      if (item.classList.contains('is-open')) panel.style.height = 'auto';
      else panel.inert = true;   /* keep collapsed content out of the tab order */

      head.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');

        items.forEach(function (other) {
          if (other === item || !other.classList.contains('is-open')) return;
          collapse(other);
        });

        if (isOpen) { collapse(item); } else { expand(item); }
      });
    });

    function expand(item) {
      var panel = $('.acc__panel', item);
      var head  = $('.acc__head', item);
      item.classList.add('is-open');
      head.setAttribute('aria-expanded', 'true');
      panel.inert = false;
      panel.style.height = panel.scrollHeight + 'px';
      panel.addEventListener('transitionend', function done(e) {
        if (e.propertyName !== 'height') return;
        panel.style.height = 'auto';
        panel.removeEventListener('transitionend', done);
      });
    }

    function collapse(item) {
      var panel = $('.acc__panel', item);
      var head  = $('.acc__head', item);
      item.classList.remove('is-open');
      head.setAttribute('aria-expanded', 'false');
      panel.inert = true;
      panel.style.height = panel.scrollHeight + 'px';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { panel.style.height = '0px'; });
      });
    }
  })();

  /* ----------------------------------------------------------
     12. GST desk — live invoice working
     ---------------------------------------------------------- */
  (function gstDesk() {
    var input = $('#taxableValue');
    if (!input) return;

    var MAX = 9999999999;
    var rateGroup   = $('#gstRate');
    var supplyGroup = $('#supplyType');

    var out = {
      taxable: $('#outTaxable'), cgst: $('#outCgst'), sgst: $('#outSgst'),
      igst: $('#outIgst'), tax: $('#outTax'), total: $('#outTotal'), words: $('#outWords'),
      lblC: $('#lblCgst'), lblS: $('#lblSgst'), lblI: $('#lblIgst'),
      rowC: $('#rowCgst'), rowS: $('#rowSgst'), rowI: $('#rowIgst'),
      tag: $('#supplyTag')
    };

    var money = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    var ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    var TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function underThousand(n) {
      var s = '';
      if (n > 99) { s += ONES[Math.floor(n / 100)] + ' Hundred'; n %= 100; if (n) s += ' '; }
      if (n > 19) { s += TENS[Math.floor(n / 10)]; n %= 10; if (n) s += ' ' + ONES[n]; }
      else if (n > 0) { s += ONES[n]; }
      return s;
    }

    function indianWords(n) {
      if (n === 0) return 'Zero';
      var parts = [];
      var crore = Math.floor(n / 10000000); n %= 10000000;
      var lakh  = Math.floor(n / 100000);   n %= 100000;
      var thou  = Math.floor(n / 1000);     n %= 1000;
      if (crore) parts.push(underThousand(crore) + ' Crore');
      if (lakh)  parts.push(underThousand(lakh) + ' Lakh');
      if (thou)  parts.push(underThousand(thou) + ' Thousand');
      if (n)     parts.push(underThousand(n));
      return parts.join(' ');
    }

    function amountInWords(v) {
      var rupees = Math.floor(v);
      var paise  = Math.round((v - rupees) * 100);
      if (paise === 100) { rupees += 1; paise = 0; }
      var s = 'Rupees ' + indianWords(rupees);
      if (paise > 0) s += ' and ' + indianWords(paise) + ' Paise';
      return s + ' Only';
    }

    function activeRate() {
      var on = rateGroup ? $('[aria-checked="true"]', rateGroup) : null;
      return on ? parseFloat(on.getAttribute('data-rate')) : 18;
    }
    function activeSupply() {
      var on = supplyGroup ? $('[aria-checked="true"]', supplyGroup) : null;
      return on ? on.getAttribute('data-supply') : 'intra';
    }

    function flash() {
      if (REDUCED) return;
      [out.total, out.tax].forEach(function (el) {
        if (!el) return;
        el.classList.remove('flash');
        void el.offsetWidth;
        el.classList.add('flash');
      });
    }

    function render() {
      var raw = parseFloat(input.value);
      var taxable = isNaN(raw) ? 0 : Math.min(Math.max(raw, 0), MAX);
      var rate = activeRate();
      var inter = activeSupply() === 'inter';

      var totalTax = taxable * rate / 100;
      var half = totalTax / 2;
      var cgst = inter ? 0 : half;
      var sgst = inter ? 0 : half;
      var igst = inter ? totalTax : 0;
      var grand = taxable + totalTax;

      out.taxable.textContent = money.format(taxable);
      out.cgst.textContent = money.format(cgst);
      out.sgst.textContent = money.format(sgst);
      out.igst.textContent = money.format(igst);
      out.tax.textContent = money.format(totalTax);
      out.total.textContent = money.format(grand);
      out.words.textContent = amountInWords(grand);

      var halfRate = (rate / 2).toString().replace(/\.0+$/, '');
      out.lblC.textContent = '@ ' + halfRate + '%';
      out.lblS.textContent = '@ ' + halfRate + '%';
      out.lblI.textContent = '@ ' + rate + '%';

      out.rowC.hidden = inter;
      out.rowS.hidden = inter;
      out.rowI.hidden = !inter;
      out.tag.textContent = inter ? 'Inter-state' : 'Intra-state';

      flash();
    }

    function wire(group) {
      if (!group) return;
      var btns = $$('button', group);

      btns.forEach(function (btn, idx) {
        btn.addEventListener('click', function () {
          btns.forEach(function (b) { b.setAttribute('aria-checked', String(b === btn)); });
          render();
        });
        btn.addEventListener('keydown', function (e) {
          var dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
                  : e.key === 'ArrowLeft'  || e.key === 'ArrowUp'   ? -1 : 0;
          if (!dir) return;
          e.preventDefault();
          var next = btns[(idx + dir + btns.length) % btns.length];
          btns.forEach(function (b) { b.setAttribute('aria-checked', String(b === next)); });
          next.focus();
          render();
        });
      });
    }

    wire(rateGroup);
    wire(supplyGroup);
    input.addEventListener('input', render);
    input.addEventListener('blur', function () {
      var v = parseFloat(input.value);
      if (isNaN(v) || v < 0) input.value = 0;
      else if (v > MAX) input.value = MAX;
      render();
    });

    render();
  })();

  /* ----------------------------------------------------------
     13. Copy to clipboard
     ---------------------------------------------------------- */
  (function copy() {
    var toast = $('#toast');
    var timer = null;

    function say(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('is-on');
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { toast.classList.remove('is-on'); }, 2000);
    }

    $$('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)
            .then(function () { say('Copied to clipboard'); })
            .catch(function () { say(text); });
        } else {
          say(text);
        }
      });
    });
  })();

  /* ----------------------------------------------------------
     14. Card pointer gradient + 3D tilt + magnetic buttons
     ---------------------------------------------------------- */
  (function microInteractions() {
    if (!FINE || REDUCED) return;

    $$('.card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    $$('.tilt').forEach(function (el) {
      var max = el.classList.contains('ledger') ? 5 : 7;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          'perspective(1100px) rotateY(' + (px * max) + 'deg) rotateX(' + (-py * max) + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });

    $$('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = 'translate(' + x + 'px,' + (y - 3) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  })();

  /* ----------------------------------------------------------
     15. Footer year
     ---------------------------------------------------------- */
  (function year() {
    var el = $('#year');
    if (el) el.textContent = String(new Date().getFullYear());
  })();

})();

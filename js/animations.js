(function() {
  /* ── PALETTE ─────────────────────────────────────────────── */
  // Only BURST_COLORS is used (in spawnBurst). The earlier COLORS object
  // was a leftover from the deleted 2D particle canvas — removed.
  const BURST_COLORS = [
    [242,234,247], [197,157,217], [122,63,145],
    [170,100,200], [220,180,240], [80,30,120]
  ];

  /* ══════════════════════════════════════════════════════════
     1. PARTICLE CANVAS BACKGROUND — REMOVED
     The 2D particle system has been replaced by the WebGL ink
     fluid simulation (see #fluid-canvas + WebGLFluid init below).
     Dead `Particle` no-op class removed.
  ══════════════════════════════════════════════════════════ */

  /* ══════════════════════════════════════════════════════════
     2. COLOR BURST ON CLICK / TOUCH
     (Skipped on interactive UI like buttons / links / inputs so
     the burst doesn't compete with the user's primary action.
     Also skipped if a modifier key is held — preserves shortcuts
     like Cmd/Ctrl-click for "open in new tab".)
  ══════════════════════════════════════════════════════════ */
  function spawnBurst(x, y) {
    /* With WebGL fluid now reacting to every pointer event across
       the whole page, a heavy DOM-based ripple swarm on top is
       overkill — the ink splat IS the burst. We keep 2-3 soft DOM
       ripples so click feedback still shows for users who have
       reduced-motion enabled (which pauses the WebGL sim) or
       browsers without WebGL support. */
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const [r,g,b] = BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)];
      const size = 70 + Math.random() * 140;
      const el = document.createElement('div');
      el.className = 'burst-ripple';
      el.style.cssText = `
        left:${x}px; top:${y}px;
        width:${size}px; height:${size}px;
        background: radial-gradient(circle, rgba(${r},${g},${b},0.45) 0%, rgba(${r},${g},${b},0.12) 50%, transparent 70%);
        animation-delay: ${i * 60}ms;
        animation-duration: ${0.7 + Math.random() * 0.4}s;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1400);
    }
  }

  // Selectors where a burst would feel intrusive (steals attention from the
  // real action) or interfere (typing into inputs).
  const BURST_SKIP = 'a, button, input, textarea, select, label, [role="button"], .skill-pill, .social-link, .achievement-badge, .nav-link';

  document.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.target && e.target.closest && e.target.closest(BURST_SKIP)) return;
    spawnBurst(e.clientX, e.clientY);
  });
  document.addEventListener('touchstart', e => {
    if (e.target && e.target.closest && e.target.closest(BURST_SKIP)) return;
    Array.from(e.touches).forEach(t => spawnBurst(t.clientX, t.clientY));
  }, { passive: true });

  /* ══════════════════════════════════════════════════════════
     4. SPLIT TEXT REVEAL ANIMATION
  ══════════════════════════════════════════════════════════ */
  function initSplitText() {
    // Target section h2 headings
    document.querySelectorAll('h2.gradient-text').forEach((el, idx) => {
      const words = el.textContent.trim().split(' ');
      el.innerHTML = words.map((w, i) =>
        `<span class="split-word" style="margin-right:0.25em"><span style="transition-delay:${i * 80}ms">${w}</span></span>`
      ).join('');

      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.split-word').forEach(sw => sw.classList.add('in-view'));
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      observer.observe(el);
    });
  }

  /* ══════════════════════════════════════════════════════════
     5. HEADING UNDERLINE DRAW-IN
  ══════════════════════════════════════════════════════════ */
  function initUnderlines() {
    document.querySelectorAll('.section-label').forEach(label => {
      const next = label.nextElementSibling;
      if (next && next.tagName.match(/H[1-6]/)) {
        next.classList.add('heading-underline');
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.5 });
        observer.observe(next);
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     6. AURORA SHIMMER — DISABLED (was running on every glass
     card, painting an animated conic-gradient layer per card.
     This was the single biggest paint cost on the page.)
  ══════════════════════════════════════════════════════════ */
  function initAurora() { /* no-op — kept for call-site compatibility */ }

  /* ══════════════════════════════════════════════════════════
     7. SKILL PILLS STAGGER
  ══════════════════════════════════════════════════════════ */
  function initPillStagger() {
    document.querySelectorAll('.skill-pill').forEach((pill, i) => {
      pill.style.animationDelay = (i * 45) + 'ms';
      pill.style.animationPlayState = 'paused';
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.skill-pill').forEach(pill => {
            pill.style.animationPlayState = 'running';
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('#skills .glass').forEach(el => observer.observe(el));
  }

  /* ══════════════════════════════════════════════════════════
     8. HERO CSS PARTICLES (extra floating dots in hero)
  ══════════════════════════════════════════════════════════ */
  function initHeroParticles() {
    const hero = document.getElementById('hero');
    if (!hero) return;
    // Skip on small screens / reduced motion — tiny visual win, big perf win.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const isSmall = window.matchMedia('(max-width: 768px)').matches;
    /* Trimmed: 18 → 5 (desktop), 5 → 3 (mobile). The WebGL ink
       fluid now does the heavy lifting for hero atmosphere; these
       CSS particles are just a tiny extra sparkle. Each particle
       is a positioned + box-shadowed div animating transform —
       cheap individually, but the original count of 18 added up. */
    const COUNT = isSmall ? 3 : 5;
    const colors = ['#F2EAF7', '#C59DD9', '#7A3F91', '#a060c0', '#e0c0f0'];
    for (let i = 0; i < COUNT; i++) {
      const dot = document.createElement('div');
      const size = Math.random() * 4 + 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const duration = Math.random() * 12 + 10;
      const delay    = Math.random() * 8;
      const x        = Math.random() * 100;
      dot.className  = 'hero-particle';
      dot.style.cssText = `
        left:${x}%;
        width:${size}px; height:${size}px;
        background:${color};
        box-shadow: 0 0 ${size*2.5}px ${color};
        animation-duration:${duration}s;
        animation-delay:${delay}s;
      `;
      hero.appendChild(dot);
    }
  }

  /* ══════════════════════════════════════════════════════════
     9. SMOOTH COUNTER NUMBER FORMATTING
  ══════════════════════════════════════════════════════════ */
  // Upgrade: make counters ease-out with easing
  // (already handled by counterAnim, but add visual flourish)
  function initCounterGlow() {
    document.querySelectorAll('.counter-card').forEach(card => {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            card.style.transition = 'all 0.4s ease';
            card.style.boxShadow  = '0 0 40px rgba(122,63,145,0.25), inset 0 1px 0 rgba(197,157,217,0.1)';
            observer.unobserve(card);
          }
        });
      }, { threshold: 0.5 });
      observer.observe(card);
    });
  }

  /* ══════════════════════════════════════════════════════════
    10. PAUSE OFF-SCREEN DECORATIVE FX
        Adds `.fx-paused` to #hero and #about when they leave
        the viewport so the glitch loops, spin rings and orbs
        stop driving the GPU on long pages.
  ══════════════════════════════════════════════════════════ */
  function initOffscreenPause() {
    const targets = [document.getElementById('hero'), document.getElementById('about')].filter(Boolean);
    if (!('IntersectionObserver' in window) || targets.length === 0) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle('fx-paused', !entry.isIntersecting);
      });
    }, { threshold: 0.05 });
    targets.forEach(t => observer.observe(t));
  }

  /* ══════════════════════════════════════════════════════════
    11. NAV SCROLLSPY
        Marks the nav-link whose target section is currently
        the most visible with `aria-current="true"`, which the
        CSS turns into a fully-drawn underline.
  ══════════════════════════════════════════════════════════ */
  function initScrollspy() {
    if (!('IntersectionObserver' in window)) return;
    const links = Array.from(document.querySelectorAll('nav a.nav-link[href^="#"]'));
    if (links.length === 0) return;

    // Map section id -> all links that point to it (desktop + mobile menu).
    const idToLinks = new Map();
    links.forEach(link => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      if (!idToLinks.has(id)) idToLinks.set(id, []);
      idToLinks.get(id).push(link);
    });

    const sections = Array.from(idToLinks.keys())
      .map(id => document.getElementById(id))
      .filter(Boolean);

    function setActive(id) {
      idToLinks.forEach((arr, key) => {
        const isActive = key === id;
        arr.forEach(a => {
          if (isActive) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }

    // Track ratios for each section, pick the most-visible one.
    const ratios = new Map();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => ratios.set(e.target.id, e.intersectionRatio));
      let best = null, bestRatio = 0;
      ratios.forEach((r, id) => {
        if (r > bestRatio) { bestRatio = r; best = id; }
      });
      if (best) setActive(best);
    }, {
      // Subtract the navbar height from the top so a section is "active"
      // as soon as its content reaches just below the nav.
      rootMargin: '-80px 0px -50% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1]
    });
    sections.forEach(s => observer.observe(s));
  }

  /* ── INIT ALL ────────────────────────────────────────────────
     Alpine fires `alpine:initialized` once every `x-data` block has
     mounted and rendered its first pass — that's exactly when the
     `x-for` skill-pill / project-card templates have produced their
     real DOM nodes. Listen for that event instead of guessing with
     `setTimeout(600)` / `setTimeout(1200)`, which raced on slower
     devices and sometimes ran before pills existed.

     We still have a hard fallback timer (1500 ms) in case Alpine
     fails to load at all — better to wire observers against
     whatever made it into the DOM than to do nothing. */
  let didInit = false;
  function init() {
    if (didInit) return;
    didInit = true;
    initSplitText();
    initUnderlines();
    initAurora();
    initHeroParticles();
    initCounterGlow();
    initOffscreenPause();
    initScrollspy();
    initPillStagger();
  }

  document.addEventListener('alpine:initialized', init, { once: true });
  // Hard fallback if Alpine never fires (CDN blocked, parse error, …)
  setTimeout(init, 1500);

})();

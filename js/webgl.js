(function() {
  if (typeof WebGLFluid !== 'function') {
    console.warn('[fluid] WebGLFluid CDN failed to load — skipping ink background.');
    return;
  }
  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) return;

  // Respect users who ask for reduced motion.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── EVENT FORWARDING ────────────────────────────────────────
     The fluid canvas sits behind all interactive content (z-index:0,
     content uses z-index:10+), so clicks on links/buttons pass through
     naturally. The library, however, only listens on the canvas itself.
     We monkey-patch the canvas's addEventListener to redirect pointer
     events to `document`, wrapping each event so `e.offsetX/Y` matches
     the viewport coordinates the library expects.
  ────────────────────────────────────────────────────────────── */
  const FORWARDED = new Set(['mousedown', 'mousemove', 'touchstart', 'touchmove']);
  const origAdd = canvas.addEventListener.bind(canvas);
  canvas.addEventListener = function(type, listener, opts) {
    if (!FORWARDED.has(type)) {
      return origAdd(type, listener, opts);
    }
    const wrapped = function(e) {
      // Build a minimal event-shape object the lib understands.
      const fake = {
        offsetX: e.clientX,
        offsetY: e.clientY,
        targetTouches: e.targetTouches || [],
        changedTouches: e.changedTouches || [],
        target: canvas,
        currentTarget: canvas,
        // No-op preventDefault so page scrolling on mobile still works.
        preventDefault: function() {}
      };
      try { listener(fake); } catch (err) { console.warn('[fluid] listener err', err); }
    };
    // touchmove must be passive so iOS scrolling stays smooth.
    const docOpts = (type === 'touchmove' || type === 'touchstart')
      ? { passive: true } : opts;
    document.addEventListener(type, wrapped, docOpts);
  };

  /* ── INITIALIZE FLUID SIM ──────────────────────────────────── */
  // Detect if user is on a small/low-power device → lower resolution.
  const isMobile = window.matchMedia('(max-width: 768px)').matches
                || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Detect low-end devices via hardwareConcurrency (cores) + deviceMemory.
  const cores  = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const isLowEnd = cores <= 4 || memory <= 4;

  // ── BUILD CONFIG ────────────────────────────────────────────
  // Tuned for *smooth* ink flow over raw fidelity:
  //   • BLOOM disabled (single biggest GPU saver — 4-6 extra passes/frame)
  //   • SHADING disabled (saves a fragment-shader branch)
  //   • DYE_RESOLUTION halved (1024 → 512) — barely visible at canvas size
  //   • Splats are slightly slower & wider → ink trails feel buttery
  const fluidConfig = {
    TRIGGER: 'hover',
    IMMEDIATE: true,
    AUTO: true,
    INTERVAL: reduceMotion ? 14000 : (isMobile || isLowEnd ? 9000 : 6500),
    SIM_RESOLUTION:  isMobile || isLowEnd ? 64  : 96,
    DYE_RESOLUTION:  isMobile || isLowEnd ? 256 : 512,
    CAPTURE_RESOLUTION: 256,
    DENSITY_DISSIPATION: 1.6,   // ink fades a touch faster → less overdraw
    VELOCITY_DISSIPATION: 1.2,
    PRESSURE: 0.78,
    PRESSURE_ITERATIONS: 14,    // was 20
    CURL: 18,
    SPLAT_RADIUS: isMobile ? 0.28 : 0.22,
    SPLAT_FORCE: 4200,          // softer push → calmer flow
    SPLAT_COUNT: isMobile || isLowEnd ? 2 : 3,
    SHADING: false,             // OFF
    COLORFUL: false,
    COLOR_UPDATE_SPEED: 2,
    PAUSED: reduceMotion,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    TRANSPARENT: true,
    BLOOM: false,               // OFF — massive perf win
    BLOOM_ITERATIONS: 4,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.4,
    BLOOM_THRESHOLD: 0.6,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: false
  };

  // ── LAZY-INIT (don't block first paint / Alpine boot) ───────
  let fluidStarted = false;
  function startFluid() {
    if (fluidStarted) return;
    fluidStarted = true;
    try { WebGLFluid(canvas, fluidConfig); }
    catch (err) { console.warn('[fluid] init failed', err); }
  }
  // Use requestIdleCallback if available, fallback to load+timeout.
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(startFluid, { timeout: 1500 });
  } else if (document.readyState === 'complete') {
    setTimeout(startFluid, 600);
  } else {
    window.addEventListener('load', () => setTimeout(startFluid, 600), { once: true });
  }

  /* ── PAUSE WHEN TAB IS HIDDEN OR HERO IS OFFSCREEN ──────────
     The lib watches spacebar; a synthetic 'P' keydown toggles
     its PAUSED state. We toggle it on tab hidden + scroll-away.
  ────────────────────────────────────────────────────────────── */
  let isPaused = false;
  function setPaused(shouldPause) {
    if (shouldPause === isPaused) return;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP' }));
    isPaused = shouldPause;
  }
  document.addEventListener('visibilitychange', function() {
    setPaused(document.hidden);
  });

  // Pause once user has scrolled well past the hero — saves
  // tons of GPU on long scrolls through the rest of the page.
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function() {
      const past = window.scrollY > window.innerHeight * 1.2;
      setPaused(past);
      ticking = false;
    });
  }, { passive: true });
})();

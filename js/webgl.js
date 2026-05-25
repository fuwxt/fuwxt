/* ============================================================
   WEBGL FLUID INK BACKGROUND (toukoum.fr-style)

   Behavior contract (per design brief):
     • Visible across the ENTIRE page, not just the hero.
       The canvas is `position:fixed; inset:0` so it's a single
       persistent layer behind every section.
     • A splat appears on click / touch / pointer-move.
     • Splats slowly fade (low DENSITY_DISSIPATION).
     • Each new splat picks a fresh hue (COLORFUL=true with high
       COLOR_UPDATE_SPEED rotates colors per splat).
     • If the previous splat hasn't fully faded yet, the new
       splat blends with whatever is still on screen — this is
       the native behavior of stable-fluids (colors mix in the
       velocity + density fields, not replace).
     • Idle? Sim auto-pauses to keep the GPU calm.

   Implementation note:
     Built on the `webgl-fluid` npm package by JaspervDalen
     (Pavel's classic stable-fluids port). The canvas sits behind
     all interactive content, so its native event listeners would
     never fire — we monkey-patch its addEventListener so any
     pointer event on the document forwards into the simulation.
============================================================ */

(function() {
  if (typeof WebGLFluid !== 'function') {
    console.warn('[fluid] WebGLFluid CDN failed to load — skipping ink background.');
    return;
  }
  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 768px)').matches
                || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const cores  = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const isLowEnd = cores <= 4 || memory <= 4;

  /* ── EVENT FORWARDING ────────────────────────────────────────
     The fluid canvas sits behind all interactive content (z:0,
     content uses z:10+), so clicks pass through to links/buttons.
     The library only listens on the canvas itself. We monkey-
     patch its addEventListener so it actually receives ALL
     pointer events happening on the document — that way the
     entire page acts as a "fluid trigger" surface, not just the
     hero region.

     Critical: we DO NOT call preventDefault on touch events.
     That would block scrolling on mobile.
  ────────────────────────────────────────────────────────────── */
  const FORWARDED = new Set([
    'mousedown', 'mousemove', 'mouseup',
    'touchstart', 'touchmove', 'touchend'
  ]);
  const origAdd = canvas.addEventListener.bind(canvas);
  canvas.addEventListener = function(type, listener, opts) {
    if (!FORWARDED.has(type)) return origAdd(type, listener, opts);
    const wrapped = function(e) {
      const fake = {
        offsetX: e.clientX,
        offsetY: e.clientY,
        targetTouches: e.targetTouches || [],
        changedTouches: e.changedTouches || [],
        target: canvas,
        currentTarget: canvas,
        preventDefault: function() {}   // no-op so scroll stays smooth
      };
      try { listener(fake); } catch (err) { /* swallow */ }
    };
    const docOpts = (type.startsWith('touch')) ? { passive: true } : opts;
    document.addEventListener(type, wrapped, docOpts);
  };

  /* ── FLUID CONFIG ───────────────────────────────────────────
     Tuned for toukoum-style behavior:

       AUTO=false, IMMEDIATE=false → no auto-splats; the canvas
         stays empty until the user actually interacts. Saves
         GPU on idle and matches the "appears on touch" brief.

       COLORFUL=true + COLOR_UPDATE_SPEED=18 → each splat picks
         a markedly different color from the lib's HSV cycle.

       DENSITY_DISSIPATION=0.92 → very slow density fade; ink
         lingers ~5-7 seconds. Lower = stays longer.
       VELOCITY_DISSIPATION=0.55 → slow velocity decay so colors
         keep flowing and mixing while they fade.

       BLOOM, SUNRAYS, SHADING all OFF — biggest GPU savings.
  ────────────────────────────────────────────────────────────── */
  const fluidConfig = {
    TRIGGER: 'hover',
    IMMEDIATE: false,
    AUTO: false,
    INTERVAL: 9999999,                 // effectively disabled
    SIM_RESOLUTION:    isMobile || isLowEnd ? 64  : 96,
    DYE_RESOLUTION:    isMobile || isLowEnd ? 256 : 512,
    CAPTURE_RESOLUTION: 256,
    DENSITY_DISSIPATION:  0.92,        // slow, toukoum-style fade
    VELOCITY_DISSIPATION: 0.55,
    PRESSURE: 0.78,
    PRESSURE_ITERATIONS: 12,
    CURL: 22,
    SPLAT_RADIUS: isMobile ? 0.30 : 0.24,
    SPLAT_FORCE: 5800,
    SPLAT_COUNT: 1,
    SHADING: false,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 18,
    PAUSED: reduceMotion,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    TRANSPARENT: true,
    BLOOM: false,
    BLOOM_ITERATIONS: 4,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.4,
    BLOOM_THRESHOLD: 0.6,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: false
  };

  /* ── LAZY-INIT ─────────────────────────────────────────────
     Don't block first paint / Alpine boot. Use requestIdleCallback
     when available, fall back to a load-delay otherwise. */
  let fluidStarted = false;
  function startFluid() {
    if (fluidStarted) return;
    fluidStarted = true;
    try { WebGLFluid(canvas, fluidConfig); }
    catch (err) { console.warn('[fluid] init failed', err); }
  }
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(startFluid, { timeout: 1500 });
  } else if (document.readyState === 'complete') {
    setTimeout(startFluid, 600);
  } else {
    window.addEventListener('load', () => setTimeout(startFluid, 600), { once: true });
  }

  /* ── PAUSE WHEN TAB HIDDEN ────────────────────────────────── */
  let isPaused = false;
  function setPaused(shouldPause) {
    if (shouldPause === isPaused) return;
    // The lib watches spacebar for pause; a synthetic 'P' keydown
    // toggles its PAUSED state.
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP' }));
    isPaused = shouldPause;
  }
  document.addEventListener('visibilitychange', () => setPaused(document.hidden));

  /* ── PAGE-WIDE FADE FLOOR (no scroll-out fade-to-zero) ──────
     Per the new design brief the WebGL ink must be visible
     across the WHOLE page, not just the hero. We map scroll to
     a 0.55 → 1.0 multiplier on `--fluid-fade`:
       • ratio ≤ 0.6  vh : full strength      (hero region)
       • ratio 0.6→1.2 vh : interpolate 1.0 → 0.55
       • ratio ≥ 1.2  vh : steady 0.55 floor  (rest of page)
     CSS multiplies this into the base opacity (0.75 dark /
     0.45 light) so the absolute opacity past the hero is
     ~0.41 dark / ~0.25 light — visible but never overpowering.
  ────────────────────────────────────────────────────────────── */
  const FADE_START = 0.6;
  const FADE_END   = 1.2;
  const FADE_FLOOR = 0.55;
  let fadeTicking = false;
  let lastFade    = 1;

  function applyFade() {
    const vh    = window.innerHeight || 1;
    const ratio = window.scrollY / vh;
    let fade;
    if (ratio <= FADE_START)      fade = 1;
    else if (ratio >= FADE_END)   fade = FADE_FLOOR;
    else fade = 1 - (1 - FADE_FLOOR) * (ratio - FADE_START) / (FADE_END - FADE_START);

    const rounded = Math.round(fade * 100) / 100;
    if (rounded !== lastFade) {
      canvas.style.setProperty('--fluid-fade', String(rounded));
      lastFade = rounded;
    }
  }
  window.addEventListener('scroll', () => {
    if (fadeTicking) return;
    fadeTicking = true;
    requestAnimationFrame(() => { applyFade(); fadeTicking = false; });
  }, { passive: true });
  applyFade();

  /* ── IDLE PAUSE (battery saver) ─────────────────────────────
     If nothing has interacted for 25 seconds, pause the
     simulation. Resume instantly on any pointer activity. */
  let lastActivity = Date.now();
  function bumpActivity() {
    lastActivity = Date.now();
    if (isPaused && !document.hidden) setPaused(false);
  }
  ['pointerdown', 'pointermove', 'touchstart', 'touchmove', 'wheel', 'keydown']
    .forEach(t => document.addEventListener(t, bumpActivity, { passive: true }));

  setInterval(() => {
    if (document.hidden) return;
    if (Date.now() - lastActivity > 25000 && !isPaused) setPaused(true);
  }, 4000);

  /* ── FIRST-INTERACTION HINT ─────────────────────────────────
     On the very first user interaction (or 2.4s after init as a
     fallback), pre-warm the simulation with a single soft splat
     so the connection between "I touched the page" and "ink
     appeared" is immediately obvious. Without this, users can
     mistake the empty canvas for "no effect at all". */
  let firstSplatDone = false;
  function fireWelcomeSplat() {
    if (firstSplatDone) return;
    firstSplatDone = true;
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight * 0.55;
    document.dispatchEvent(new MouseEvent('mousedown',
      { clientX: cx,      clientY: cy,      bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove',
      { clientX: cx + 40, clientY: cy + 25, bubbles: true }));
  }
  document.addEventListener('pointermove', fireWelcomeSplat, { once: true });
  document.addEventListener('touchstart',  fireWelcomeSplat, { once: true });
  setTimeout(fireWelcomeSplat, 2400);
})();

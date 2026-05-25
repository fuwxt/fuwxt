/* ============================================================
   WEBGL FLUID INK BACKGROUND (toukoum.fr-style)

   Behavior contract:
     • Visible across the entire page, not just the hero.
       Canvas is `position:fixed; inset:0` so it's a single
       persistent layer behind every section.
     • A splat appears on click / touch / pointer-move.
     • Splats slowly fade (low DENSITY_DISSIPATION).
     • Each new splat picks a fresh hue (COLORFUL=true with high
       COLOR_UPDATE_SPEED rotates colors per splat).
     • Idle? Sim auto-pauses to keep the GPU calm.

   This is a full rewrite of the previous integration. The earlier
   version monkey-patched canvas.addEventListener to forward
   document events as plain object literals — fragile, and silently
   swallowed errors so any actual library throw was invisible.
   The new approach:

     1. Set canvas pixel dimensions explicitly (DPR-aware) before
        the library boots, so the first render isn't a default
        300×150 stretched to viewport.
     2. Make the canvas `pointer-events: none` so it never blocks
        clicks on real UI, AND so the canvas's native event
        listeners don't double-fire alongside our forwards.
     3. Forward pointer events from `document` to the canvas by
        dispatching real `MouseEvent`/`Event` instances. Real
        events resolve `offsetX/Y` correctly via the canvas's
        bounding rect (which equals the viewport, so
        offsetX = clientX) — no fake-object hacks.
     4. Probe for WebGL context up front; if unavailable, hide
        the canvas instead of letting the library throw.
     5. Errors are logged, not swallowed.
     6. Welcome splat is gated on init readiness — used to race
        with requestIdleCallback and dispatch events into a no-op
        canvas before listeners were bound.
   ============================================================ */

(function() {
  /* ── 0. LIBRARY GUARDS ───────────────────────────────────── */
  if (typeof WebGLFluid !== 'function') {
    console.warn('[fluid] webgl-fluid library failed to load — skipping ink background.');
    return;
  }
  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) {
    console.warn('[fluid] #fluid-canvas not found in DOM.');
    return;
  }

  /* ── 1. CAPABILITY DETECTION ─────────────────────────────── */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 768px)').matches
                || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const cores  = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const isLowEnd = cores <= 4 || memory <= 4;

  /* ── 2. WEBGL AVAILABILITY ───────────────────────────────────
     Some browsers (privacy modes, headless VMs, throttled mobile
     battery savers) silently fail to allocate a GL context. Probe
     up front so we hide gracefully instead of throwing later. */
  function hasWebGL() {
    try {
      const probe = document.createElement('canvas');
      return !!(probe.getContext('webgl2')
             || probe.getContext('webgl')
             || probe.getContext('experimental-webgl'));
    } catch (e) { return false; }
  }
  if (!hasWebGL()) {
    console.warn('[fluid] WebGL not available — disabling ink background.');
    canvas.style.display = 'none';
    return;
  }

  /* ── 3. CANVAS SIZING (DPR-aware, explicit) ─────────────────
     Set the drawing-buffer dimensions BEFORE the library boots so
     the first frame renders at the right resolution. The library
     has its own resize logic afterwards (uses clientWidth × DPR),
     which keeps the buffer in sync as the viewport changes. */
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(window.innerWidth  * dpr));
    const h = Math.max(1, Math.floor(window.innerHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
    }
  }
  sizeCanvas();

  /* ── 4. CANVAS NEVER BLOCKS UI ───────────────────────────────
     With `pointer-events: none` the canvas never intercepts real
     clicks (links, buttons, project cards all stay clickable), and
     its own listeners don't double-fire when the user clicks empty
     body space. Events still arrive via `dispatchEvent` from the
     forwarders below. */
  canvas.style.pointerEvents = 'none';

  /* ── 5. EVENT FORWARDING ─────────────────────────────────────
     The library binds its `mousedown / mousemove / mouseup` and
     `touchstart / touchmove / touchend` listeners directly on the
     canvas. We listen on `document` and re-dispatch real Event
     objects on the canvas — this triggers the library's listeners
     with `e.offsetX/Y` correctly resolved (canvas covers viewport
     → offsetX === clientX) and `e.targetTouches[i].clientX/Y`
     pointing at the original `Touch` objects.

     Forwarding only kicks in once `initState.ready` is true, so
     events fired during init aren't lost into a no-op canvas. */
  const initState = { ready: false };

  function forwardMouse(type) {
    return function(e) {
      if (!initState.ready) return;
      let ev;
      try {
        ev = new MouseEvent(type, {
          bubbles:    false,
          cancelable: false,
          clientX:    e.clientX,
          clientY:    e.clientY,
          button:     e.button  || 0,
          buttons:    e.buttons || 0
        });
      } catch (err) { return; }
      try { canvas.dispatchEvent(ev); } catch (err) {
        console.error('[fluid] mouse dispatch failed:', err);
      }
    };
  }

  function forwardTouch(type) {
    return function(e) {
      if (!initState.ready) return;
      // Cloning a TouchEvent reliably is hard across browsers
      // (Safari rejects synthetic Touch instances). Use a generic
      // Event and copy the original `Touch` lists as own properties
      // — the library reads `e.targetTouches[i].clientX`, which
      // works the same whether the host is a TouchEvent or a plain
      // Event with a `targetTouches` property.
      let ev;
      try {
        ev = new Event(type, { bubbles: false, cancelable: false });
      } catch (err) { return; }
      try {
        Object.defineProperty(ev, 'targetTouches',  { value: e.targetTouches  || [] });
        Object.defineProperty(ev, 'changedTouches', { value: e.changedTouches || [] });
        Object.defineProperty(ev, 'touches',        { value: e.touches        || [] });
      } catch (err) { /* defineProperty can fail in strict CSP — fall through */ }
      try { canvas.dispatchEvent(ev); } catch (err) {
        console.error('[fluid] touch dispatch failed:', err);
      }
    };
  }

  // `passive: true` everywhere — we never preventDefault on the
  // ORIGINAL document event (that would break scrolling on mobile).
  // The library may call preventDefault on the dispatched event,
  // but that has no effect since cancelable:false above.
  document.addEventListener('mousedown',  forwardMouse('mousedown'),  { passive: true });
  document.addEventListener('mousemove',  forwardMouse('mousemove'),  { passive: true });
  document.addEventListener('mouseup',    forwardMouse('mouseup'),    { passive: true });
  document.addEventListener('touchstart', forwardTouch('touchstart'), { passive: true });
  document.addEventListener('touchmove',  forwardTouch('touchmove'),  { passive: true });
  document.addEventListener('touchend',   forwardTouch('touchend'),   { passive: true });

  /* ── 6. FLUID CONFIG ─────────────────────────────────────────
     Tuned for slow-fading, color-mixing ink:

       AUTO=false, IMMEDIATE=false → no auto-splats; canvas stays
         empty until the user actually interacts. Saves GPU on idle
         and matches the "appears on touch" brief.

       COLORFUL=true + COLOR_UPDATE_SPEED=22 → each splat picks a
         markedly different color from the lib's HSV cycle.

       DENSITY_DISSIPATION=0.94 → very slow density fade; ink
         lingers ~7-10s. Lower = stays longer.

       VELOCITY_DISSIPATION=0.55 → slow velocity decay so colors
         keep flowing and mixing while they fade.

       BLOOM, SUNRAYS, SHADING all OFF — biggest GPU savings. */
  const fluidConfig = {
    TRIGGER: 'hover',
    IMMEDIATE: false,
    AUTO: false,
    INTERVAL: 9999999,                 // effectively disabled
    SIM_RESOLUTION:    isMobile || isLowEnd ? 64  : 96,
    DYE_RESOLUTION:    isMobile || isLowEnd ? 256 : 512,
    CAPTURE_RESOLUTION: 256,
    DENSITY_DISSIPATION:  0.94,
    VELOCITY_DISSIPATION: 0.55,
    PRESSURE: 0.78,
    PRESSURE_ITERATIONS: 12,
    CURL: 24,
    SPLAT_RADIUS: isMobile ? 0.30 : 0.27,
    SPLAT_FORCE: 6400,
    SPLAT_COUNT: 1,
    SHADING: false,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 22,
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

  /* ── 7. LAZY-INIT ────────────────────────────────────────────
     Don't block first paint / Alpine boot. Use requestIdleCallback
     when available, fall back to a load-delay otherwise. */
  function startFluid() {
    if (initState.ready) return;
    try {
      WebGLFluid(canvas, fluidConfig);
      initState.ready = true;
    } catch (err) {
      console.error('[fluid] init failed — disabling ink background:', err);
      canvas.style.display = 'none';
    }
  }
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(startFluid, { timeout: 1500 });
  } else if (document.readyState === 'complete') {
    setTimeout(startFluid, 600);
  } else {
    window.addEventListener('load', () => setTimeout(startFluid, 600), { once: true });
  }

  /* ── 8. PAUSE WHEN TAB HIDDEN ────────────────────────────────
     The library binds 'KeyP' on window for pause toggle; a
     synthetic keydown flips its internal PAUSED flag. */
  let isPaused = !!reduceMotion;
  function setPaused(shouldPause) {
    if (!initState.ready || shouldPause === isPaused) return;
    try {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        code: 'KeyP', key: 'p', bubbles: true
      }));
      isPaused = shouldPause;
    } catch (e) { /* untrusted KeyboardEvent — fall through silently */ }
  }
  document.addEventListener('visibilitychange', () => setPaused(document.hidden));

  /* ── 9. PAGE-WIDE FADE FLOOR ─────────────────────────────────
     The WebGL ink should be visible across the WHOLE page, not
     just the hero. Map scroll to a 0.65 → 1.0 multiplier on
     `--fluid-fade`:
       • ratio ≤ 0.6  vh : full strength      (hero region)
       • ratio 0.6→1.2 vh : interpolate 1.0 → 0.65
       • ratio ≥ 1.2  vh : steady 0.65 floor  (rest of page)
     CSS multiplies this into the base opacity (0.85 dark / 0.55
     light) so absolute opacity past the hero is ~0.55 dark and
     ~0.36 light — visibly alive but never overpowering content. */
  const FADE_START = 0.6;
  const FADE_END   = 1.2;
  const FADE_FLOOR = 0.65;
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

  /* ── 10. IDLE PAUSE (battery saver) ──────────────────────────
     If nothing has interacted for 25s, pause the simulation.
     Resume instantly on any pointer activity. */
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

  /* ── 11. WELCOME SPLAT ───────────────────────────────────────
     On first user interaction (or 3s after init as a fallback),
     pre-warm the simulation with a soft splat so the link between
     "I touched the page" and "ink appeared" is immediately
     obvious. Without this, users sometimes mistake the empty
     canvas for "no effect at all".

     Gated on `initState.ready` — the previous version raced with
     requestIdleCallback and silently lost the splat when fired
     before the library bound its listeners. */
  let welcomeFired = false;
  function fireWelcomeSplat() {
    if (welcomeFired) return;
    if (!initState.ready) {
      // Library not yet bound — re-check shortly. Bounded retries
      // so we never spin forever if init failed.
      if (fireWelcomeSplat._retries == null) fireWelcomeSplat._retries = 0;
      if (fireWelcomeSplat._retries++ < 30) {
        setTimeout(fireWelcomeSplat, 200);
      }
      return;
    }
    welcomeFired = true;

    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight * 0.55;
    const dispatch = (type, x, y) => {
      let ev;
      try {
        ev = new MouseEvent(type, {
          bubbles: false, cancelable: false,
          clientX: x, clientY: y, button: 0
        });
      } catch (e) { return; }
      try { canvas.dispatchEvent(ev); } catch (e) {}
    };

    // mousedown + a short trail of moves so the splat has a
    // velocity vector. A single mousedown alone produces no
    // visible dye in stable-fluids.
    dispatch('mousedown', cx, cy);
    requestAnimationFrame(() => {
      dispatch('mousemove', cx + 30, cy + 18);
      requestAnimationFrame(() => {
        dispatch('mousemove', cx + 60, cy + 36);
        dispatch('mouseup',   cx + 60, cy + 36);
      });
    });
  }
  document.addEventListener('pointermove', fireWelcomeSplat, { once: true, passive: true });
  document.addEventListener('touchstart',  fireWelcomeSplat, { once: true, passive: true });
  // Fallback: fire 3s after script load even if user hasn't moved.
  setTimeout(fireWelcomeSplat, 3000);
})();

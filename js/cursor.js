(function() {
  /* ══════════════════════════════════════════════════════════
     CUSTOM MAGNETIC CURSOR (desktop fine-pointer only)
     ──────────────────────────────────────────────────────────
     Two layered elements:
       • #cursor-glow → small instant-tracking radial glow
       • #cursor-ring → larger ring that follows with lerp
     Both are decorative; the OS cursor stays primary input.
     If either element is missing the module bails out — earlier
     version threw `Cannot read properties of null` and crashed
     the whole IIFE silently.
  ══════════════════════════════════════════════════════════ */
  const glowEl = document.getElementById('cursor-glow');
  const ringEl = document.getElementById('cursor-ring');
  if (!glowEl || !ringEl) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  let cx = 0, cy = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    glowEl.style.left = cx + 'px';
    glowEl.style.top  = cy + 'px';
  }, { passive: true });

  // Ring follows with lerp
  (function lerpRing() {
    rx += (cx - rx) * 0.12;
    ry += (cy - ry) * 0.12;
    ringEl.style.left = rx + 'px';
    ringEl.style.top  = ry + 'px';
    requestAnimationFrame(lerpRing);
  })();

  // Enlarge on hover over interactive elements
  const interactives = 'a, button, .glass, .project-card, .skill-pill, .social-link, .btn-primary, .btn-outline, .btn-download';
  document.addEventListener('mouseover', e => {
    if (e.target && e.target.closest && e.target.closest(interactives)) {
      ringEl.style.width  = '64px';
      ringEl.style.height = '64px';
      ringEl.style.borderColor = 'rgba(197,157,217,0.7)';
      glowEl.style.width  = '32px';
      glowEl.style.height = '32px';
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target && e.target.closest && e.target.closest(interactives)) {
      ringEl.style.width  = '44px';
      ringEl.style.height = '44px';
      ringEl.style.borderColor = 'rgba(197,157,217,0.35)';
      glowEl.style.width  = '20px';
      glowEl.style.height = '20px';
    }
  });
})();

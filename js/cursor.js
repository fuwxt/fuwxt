(function () {
  'use strict';
  const glow = document.getElementById('cursor-glow');
  const ring = document.getElementById('cursor-ring');
  if (!glow || !ring || !window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let cx = 0, cy = 0, rx = 0, ry = 0, frame = 0, active = false;
  function render() {
    if (!active || document.hidden) { frame = 0; return; }
    rx += (cx - rx) * 0.14;
    ry += (cy - ry) * 0.14;
    ring.style.transform = `translate3d(${rx - 22}px, ${ry - 22}px, 0)`;
    frame = requestAnimationFrame(render);
  }
  document.addEventListener('mousemove', (event) => {
    cx = event.clientX; cy = event.clientY;
    glow.style.transform = `translate3d(${cx - 10}px, ${cy - 10}px, 0)`;
    active = true;
    if (!frame) frame = requestAnimationFrame(render);
  }, { passive: true });
  document.addEventListener('mouseleave', () => { active = false; glow.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { glow.style.opacity = ''; ring.style.opacity = ''; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
    else if (active && !frame) frame = requestAnimationFrame(render);
  });

  const interactive = 'a, button, input, textarea, .glass, .project-card, .skill-pill, .social-link';
  document.addEventListener('pointerover', (event) => {
    const isInteractive = Boolean(event.target.closest?.(interactive));
    ring.classList.toggle('is-interactive', isInteractive);
    glow.classList.toggle('is-interactive', isInteractive);
  }, { passive: true });
})();

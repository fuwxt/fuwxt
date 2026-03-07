/**
 * particles.js
 * ─────────────────────────────────────────────────────────────────
 * Minimal, self-contained particle / node-graph background for the
 * hero section. No external dependencies.
 *
 * Features:
 *  - Floating dot nodes with neon purple / cyan / blue palette
 *  - Dynamic line connections between nearby particles
 *  - Mouse-repel interaction within a radius
 *  - Smooth RAF loop, auto-resizes with the viewport
 *  - Respects prefers-reduced-motion
 * ─────────────────────────────────────────────────────────────────
 */
(function ParticleSystem() {
  'use strict';

  /* ── Config ─────────────────────────────────────────────── */
  const CONFIG = {
    COUNT:              70,       // number of particles
    MAX_RADIUS:         1.8,      // particle dot size (max)
    MIN_RADIUS:         0.4,      // particle dot size (min)
    MAX_SPEED:          0.38,     // maximum velocity magnitude
    CONNECTION_DIST:    130,      // px – max distance to draw a line
    MOUSE_REPEL_RADIUS: 110,      // px – mouse repulsion field
    MOUSE_REPEL_FORCE:  0.018,    // acceleration multiplier
    COLORS: [                     // neon palette
      'rgba(168, 85,  247, VAL)', // purple
      'rgba(168, 85,  247, VAL)', // purple (weighted double)
      'rgba(34,  211, 238, VAL)', // cyan
      'rgba(59,  130, 246, VAL)', // blue
    ],
    LINE_ALPHA_BASE:    0.06,     // max line opacity
    DOT_ALPHA:          0.75,     // particle dot alpha
  };

  /* ── State ───────────────────────────────────────────────── */
  let canvas, ctx, W, H, particles, rafId;
  let mouseX = -9999, mouseY = -9999;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Particle constructor ────────────────────────────────── */
  function createParticle() {
    const speed = (Math.random() * CONFIG.MAX_SPEED * 2) - CONFIG.MAX_SPEED;
    const colorTemplate = CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];
    const alpha = (Math.random() * 0.5 + 0.25) * CONFIG.DOT_ALPHA;
    return {
      x:      Math.random() * W,
      y:      Math.random() * H,
      r:      Math.random() * (CONFIG.MAX_RADIUS - CONFIG.MIN_RADIUS) + CONFIG.MIN_RADIUS,
      vx:     (Math.random() - 0.5) * CONFIG.MAX_SPEED,
      vy:     (Math.random() - 0.5) * CONFIG.MAX_SPEED,
      color:  colorTemplate.replace('VAL', alpha.toFixed(2)),
      glow:   colorTemplate.replace('VAL', (alpha * 0.4).toFixed(2)),
    };
  }

  /* ── Initialise ──────────────────────────────────────────── */
  function init() {
    canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    resize();

    particles = Array.from({ length: CONFIG.COUNT }, createParticle);

    // Mouse tracking
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave, { passive: true });

    // Resize
    window.addEventListener('resize', onResize, { passive: true });

    // Only animate if motion is allowed
    if (!prefersReducedMotion) {
      rafId = requestAnimationFrame(loop);
    } else {
      // Static snapshot for reduced-motion users
      drawFrame();
    }
  }

  /* ── Resize handler ──────────────────────────────────────── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function onResize() {
    resize();
    // Re-distribute particles that ended up outside new bounds
    if (particles) {
      particles.forEach(p => {
        if (p.x > W) p.x = Math.random() * W;
        if (p.y > H) p.y = Math.random() * H;
      });
    }
  }

  /* ── Mouse handlers ──────────────────────────────────────── */
  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  function onMouseLeave() {
    mouseX = -9999;
    mouseY = -9999;
  }

  /* ── Update physics ──────────────────────────────────────── */
  function updateParticle(p) {
    // Mouse repulsion
    const dx = p.x - mouseX;
    const dy = p.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < CONFIG.MOUSE_REPEL_RADIUS && dist > 0) {
      const force = (CONFIG.MOUSE_REPEL_RADIUS - dist) / CONFIG.MOUSE_REPEL_RADIUS;
      const angle = Math.atan2(dy, dx);
      p.vx += Math.cos(angle) * force * CONFIG.MOUSE_REPEL_FORCE * 10;
      p.vy += Math.sin(angle) * force * CONFIG.MOUSE_REPEL_FORCE * 10;
    }

    // Dampen velocity toward max speed
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > CONFIG.MAX_SPEED) {
      p.vx = (p.vx / speed) * CONFIG.MAX_SPEED;
      p.vy = (p.vy / speed) * CONFIG.MAX_SPEED;
    }

    // Move
    p.x += p.vx;
    p.y += p.vy;

    // Bounce off walls
    if (p.x < 0)  { p.x  = 0;  p.vx *= -1; }
    if (p.x > W)  { p.x  = W;  p.vx *= -1; }
    if (p.y < 0)  { p.y  = 0;  p.vy *= -1; }
    if (p.y > H)  { p.y  = H;  p.vy *= -1; }
  }

  /* ── Draw a single frame ─────────────────────────────────── */
  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    // Draw connection lines first (behind dots)
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.CONNECTION_DIST) {
          const alpha = CONFIG.LINE_ALPHA_BASE * (1 - dist / CONFIG.CONNECTION_DIST);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(168, 85, 247, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Draw dots
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur  = 10;
      ctx.shadowColor = p.glow;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  /* ── Animation loop ──────────────────────────────────────── */
  function loop() {
    particles.forEach(updateParticle);
    drawFrame();
    rafId = requestAnimationFrame(loop);
  }

  /* ── Cleanup (optional, for SPA navigation) ─────────────── */
  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseleave', onMouseLeave);
  }

  /* ── Bootstrap ───────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose destroy for optional teardown
  window.ParticleSystem = { destroy };

}());

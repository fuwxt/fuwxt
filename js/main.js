/* =============================================================
   main.js — Portfolio of Muhammad Azhar Shahbaz
   Single file, no framework, no jQuery, no lodash.
   Sections: theme, loader, navbar, hero, tabs, work,
             testimonials, timeline, counters, cursor, WebGL
============================================================= */

'use strict';

/* ─────────────────────────────────────────────
   0. REDUCED MOTION GATE
───────────────────────────────────────────── */
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

/* ─────────────────────────────────────────────
   1. THEME TOGGLE
───────────────────────────────────────────── */
function initTheme() {
  const html   = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  function applyTheme(t) {
    html.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    // swap icon
    const iconSun  = toggle.querySelector('.icon-sun');
    const iconMoon = toggle.querySelector('.icon-moon');
    if (iconSun)  iconSun.style.display  = t === 'dark'  ? 'block' : 'none';
    if (iconMoon) iconMoon.style.display = t === 'light' ? 'block' : 'none';
    toggle.setAttribute('aria-label',
      t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  toggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Sync icon state on page load
  applyTheme(html.getAttribute('data-theme') || 'dark');

  // Enable CSS transitions only after first paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      html.classList.add('theme-loaded');
    });
  });
}


/* ─────────────────────────────────────────────
   2. LOADING SCREEN
───────────────────────────────────────────── */
function initLoader(onDone) {
  const screen = document.getElementById('loading-screen');
  if (!screen) { onDone(); return; }

  if (prefersReducedMotion) {
    screen.style.display = 'none';
    screen.setAttribute('aria-hidden', 'true');
    onDone();
    return;
  }

  // Draw the underline
  const line = screen.querySelector('.loader-underline');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (line) line.classList.add('draw');
    });
  });

  // Fade out at 850ms
  setTimeout(() => {
    screen.classList.add('fade-out');
    screen.addEventListener('transitionend', () => {
      screen.style.display = 'none';
      screen.setAttribute('aria-hidden', 'true');
      onDone();
    }, { once: true });
  }, 850);
}

/* ─────────────────────────────────────────────
   3. NAVBAR — shrink on scroll, active link, mobile overlay
───────────────────────────────────────────── */
function initNavbar() {
  const navbar   = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const overlay  = document.getElementById('mobile-overlay');
  const overlayClose = document.getElementById('overlay-close');
  const mobileLinks  = overlay ? overlay.querySelectorAll('a') : [];
  let overlayOpen = false;

  // Shrink on scroll
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      if (navbar) {
        navbar.classList.toggle('shrunk', window.scrollY > 80);
      }
      scrollTicking = false;
    });
  }, { passive: true });

  // Active link via IntersectionObserver
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObserver.observe(s));

  // Mobile overlay
  function openOverlay() {
    if (!overlay || !hamburger) return;
    overlayOpen = true;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Focus first link
    setTimeout(() => {
      const first = overlay.querySelector('a');
      if (first) first.focus();
    }, 60);
  }

  function closeOverlay() {
    if (!overlay || !hamburger) return;
    overlayOpen = false;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    hamburger.focus();
  }

  if (hamburger) hamburger.addEventListener('click', () => {
    overlayOpen ? closeOverlay() : openOverlay();
  });

  if (overlayClose) overlayClose.addEventListener('click', closeOverlay);

  mobileLinks.forEach(a => a.addEventListener('click', closeOverlay));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlayOpen) closeOverlay();
  });
}


/* ─────────────────────────────────────────────
   4. HERO ANIMATIONS
───────────────────────────────────────────── */
function initHero() {
  // ── 4a. Availability + description + cta staggered fade-ins
  const els = [
    { sel: '.hero-availability', delay: 0 },
    { sel: '.hero-typewriter',   delay: 300 },
    { sel: '.hero-description',  delay: 900 },
    { sel: '.hero-cta',          delay: 1100 },
    { sel: '.hero-stats',        delay: 1250 },
  ];

  els.forEach(({ sel, delay }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    if (prefersReducedMotion) { el.classList.add('show'); return; }
    setTimeout(() => el.classList.add('show'), delay + 200);
  });

  // ── 4b. Scroll indicator
  const scrollInd = document.querySelector('.scroll-indicator');
  if (scrollInd) {
    if (prefersReducedMotion) {
      scrollInd.classList.add('show');
    } else {
      setTimeout(() => scrollInd.classList.add('show'), 1700);
    }
  }
}

/* ─────────────────────────────────────────────
   5. HERO NAME CHAR ANIMATION
───────────────────────────────────────────── */
function initHeroChars(startDelay) {
  if (prefersReducedMotion) {
    document.querySelectorAll('.char').forEach(c => c.classList.add('in'));
    return;
  }
  document.querySelectorAll('.char').forEach((ch, i) => {
    setTimeout(() => ch.classList.add('in'), startDelay + i * 55);
  });
}

/* ─────────────────────────────────────────────
   6. TYPEWRITER
───────────────────────────────────────────── */
function initTypewriter() {
  const el = document.getElementById('typewriter-text');
  if (!el) return;

  const phrases = [
    'AI & LLM Specialist',
    'Motion Designer',
    'Full-Stack Developer',
    'Brand Strategist',
  ];

  if (prefersReducedMotion) {
    el.textContent = phrases[0];
    return;
  }

  let phraseIdx = 0, charIdx = 0, deleting = false;

  function tick() {
    const current = phrases[phraseIdx];
    if (!deleting) {
      charIdx++;
      el.textContent = current.slice(0, charIdx);
      if (charIdx === current.length) {
        deleting = true;
        setTimeout(tick, 1800);
        return;
      }
      setTimeout(tick, 70);
    } else {
      charIdx--;
      el.textContent = current.slice(0, charIdx);
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, 35);
    }
  }

  setTimeout(tick, 600);
}

/* ─────────────────────────────────────────────
   7. STAT COUNTERS
───────────────────────────────────────────── */
function countUp(el, target, prefix, suffix, duration) {
  if (prefersReducedMotion) {
    el.textContent = prefix + target + suffix;
    return;
  }
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(eased * target);
    el.textContent = prefix + value + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function initCounters() {
  const statsRow = document.querySelector('.hero-stats');
  if (!statsRow) return;

  const counters = statsRow.querySelectorAll('[data-count]');
  let fired = false;

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !fired) {
      fired = true;
      counters.forEach(el => {
        countUp(
          el,
          +el.dataset.count,
          el.dataset.prefix || '',
          el.dataset.suffix || '',
          +el.dataset.duration || 1500
        );
      });
      obs.disconnect();
    }
  }, { threshold: 0.3 });

  obs.observe(statsRow);
}


/* ─────────────────────────────────────────────
   8. SKILLS TABS
───────────────────────────────────────────── */
function initSkillsTabs() {
  const tablist = document.querySelector('[role="tablist"]');
  if (!tablist) return;

  const tabs   = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

  function activateTab(tab) {
    tabs.forEach(t => {
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    panels.forEach(p => p.classList.remove('active'));

    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    const panelId = tab.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('active');
      // trigger opacity fade
      panel.style.opacity = '0';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { panel.style.opacity = '1'; });
      });
    }
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        activateTab(tabs[(i + 1) % tabs.length]);
        tabs[(i + 1) % tabs.length].focus();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = (i - 1 + tabs.length) % tabs.length;
        activateTab(tabs[prev]);
        tabs[prev].focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateTab(tab);
      }
    });
  });

  // Activate first tab by default
  if (tabs[0]) activateTab(tabs[0]);
}

/* ─────────────────────────────────────────────
   9. WORK CARDS — accordion expand
───────────────────────────────────────────── */
function initWorkCards() {
  const cards = document.querySelectorAll('.project-card');
  let openCard = null;

  function closeCard(card) {
    const detail = card.querySelector('.project-detail');
    const btn    = card.querySelector('.project-expand-btn');
    if (detail) detail.classList.remove('open');
    if (btn)    btn.setAttribute('aria-expanded', 'false');
    openCard = null;
  }

  function openCardFn(card) {
    const detail = card.querySelector('.project-detail');
    const btn    = card.querySelector('.project-expand-btn');
    if (detail) detail.classList.add('open');
    if (btn)    btn.setAttribute('aria-expanded', 'true');
    openCard = card;
  }

  cards.forEach(card => {
    const btn = card.querySelector('.project-expand-btn');
    if (!btn) return;

    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (openCard && openCard !== card) closeCard(openCard);
      if (card === openCard) {
        closeCard(card);
      } else {
        openCardFn(card);
      }
    });
  });

  // Escape closes open card
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && openCard) closeCard(openCard);
  });
}

/* ─────────────────────────────────────────────
   10. TESTIMONIALS CAROUSEL
───────────────────────────────────────────── */
function initTestimonials() {
  const track = document.querySelector('.testimonials-track');
  const dots  = document.querySelectorAll('.testimonial-dot');
  if (!track) return;

  const cards = track.querySelectorAll('.testimonial-card');
  const total = cards.length;
  let current = 0;
  let autoTimer = null;
  let idleTimer  = null;

  function scrollTo(idx) {
    current = idx;
    const card = cards[idx];
    if (!card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft - 40, behavior: 'smooth' });
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  function startAuto() {
    autoTimer = setInterval(() => {
      scrollTo((current + 1) % total);
    }, 4500);
  }

  function restartAuto() {
    clearInterval(autoTimer);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startAuto, 6000);
  }

  track.addEventListener('scroll', restartAuto, { passive: true });
  track.addEventListener('touchstart', restartAuto, { passive: true });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      restartAuto();
      scrollTo(i);
    });
  });

  scrollTo(0);
  startAuto();
}


/* ─────────────────────────────────────────────
   11. TIMELINE DRAW LINE
───────────────────────────────────────────── */
function initTimeline() {
  const line = document.querySelector('.timeline-line');
  if (!line) return;

  if (prefersReducedMotion) { line.classList.add('draw'); return; }

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      line.classList.add('draw');
      obs.disconnect();
    }
  }, { threshold: 0.2 });

  obs.observe(line);
}

/* ─────────────────────────────────────────────
   12. SCROLL REVEAL
───────────────────────────────────────────── */
function initScrollReveal() {
  if (prefersReducedMotion) {
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
      .forEach(el => el.classList.add('visible'));
    return;
  }

  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  // Group siblings for stagger
  const parents = new Map();
  revealEls.forEach(el => {
    const parent = el.parentElement;
    if (!parents.has(parent)) parents.set(parent, []);
    parents.get(parent).push(el);
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const siblings = parents.get(el.parentElement) || [el];
      const idx = Math.min(siblings.indexOf(el), 5);
      el.style.transitionDelay = idx * 75 + 'ms';
      el.classList.add('visible');
      obs.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => obs.observe(el));
}

/* ─────────────────────────────────────────────
   13. CUSTOM CURSOR
───────────────────────────────────────────── */
function initCursor() {
  const dot  = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  // Hide on touch devices
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    dot.style.display  = 'none';
    ring.style.display = 'none';
    return;
  }

  let mouseX = -100, mouseY = -100;
  let ringX  = -100, ringY  = -100;
  let rafId;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animateRing() {
    ringX = lerp(ringX, mouseX, 0.12);
    ringY = lerp(ringY, mouseY, 0.12);
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    rafId = requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover states
  function addHover(selector, ringClass, dotClass) {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mouseenter', () => {
        ring.classList.add(ringClass);
        if (dotClass) dot.classList.add(dotClass);
      });
      el.addEventListener('mouseleave', () => {
        ring.classList.remove(ringClass);
        if (dotClass) dot.classList.remove(dotClass);
      });
    });
  }

  addHover('a, button', 'hover-link', 'hover-link');
  addHover('.project-card', 'hover-card', null);
}

/* ─────────────────────────────────────────────
   14. CONTACT FORM VALIDATION
───────────────────────────────────────────── */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function showError(field, msgEl, msg) {
    field.classList.add('error');
    msgEl.textContent = msg;
    msgEl.classList.add('show');
    field.setAttribute('aria-describedby', msgEl.id);
  }

  function clearError(field, msgEl) {
    field.classList.remove('error');
    msgEl.classList.remove('show');
  }

  // Live clear on input
  form.querySelectorAll('input, select, textarea').forEach(f => {
    const errEl = document.getElementById(f.id + '-error');
    if (errEl) f.addEventListener('input', () => clearError(f, errEl));
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    // Name
    const name    = form.querySelector('#cf-name');
    const nameErr = document.getElementById('cf-name-error');
    if (name && nameErr) {
      if (!name.value.trim()) {
        showError(name, nameErr, 'Name is required.');
        valid = false;
      } else clearError(name, nameErr);
    }

    // Email
    const email    = form.querySelector('#cf-email');
    const emailErr = document.getElementById('cf-email-error');
    if (email && emailErr) {
      if (!email.value.trim()) {
        showError(email, emailErr, 'Email is required.');
        valid = false;
      } else if (!emailRe.test(email.value.trim())) {
        showError(email, emailErr, 'Enter a valid email address.');
        valid = false;
      } else clearError(email, emailErr);
    }

    // Message
    const msg    = form.querySelector('#cf-message');
    const msgErr = document.getElementById('cf-message-error');
    if (msg && msgErr) {
      if (msg.value.trim().length < 20) {
        showError(msg, msgErr, 'Please write at least 20 characters.');
        valid = false;
      } else clearError(msg, msgErr);
    }

    if (!valid) return;

    // Submit
    const btn = form.querySelector('.form-submit');
    btn.textContent = 'Sending…';
    btn.disabled = true;

    // Actually submit to Formspree
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    })
    .then(res => {
      if (res.ok) {
        btn.textContent = 'Sent ✓';
        form.reset();
      } else {
        btn.textContent = 'Error — try again';
        btn.disabled = false;
      }
    })
    .catch(() => {
      btn.textContent = 'Error — try again';
      btn.disabled = false;
    });

    setTimeout(() => {
      if (btn.disabled && btn.textContent === 'Sending…') {
        btn.textContent = 'Send Message';
        btn.disabled = false;
      }
    }, 3000);
  });
}


/* ─────────────────────────────────────────────
   15. WEBGL BACKGROUND — Three.js r128 blobs
───────────────────────────────────────────── */
function initWebGL() {
  if (typeof THREE === 'undefined') {
    showCSSFallback(); return;
  }

  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) { showCSSFallback(); return; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  } catch (e) {
    showCSSFallback(); return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 5;

  const isMobile = window.innerWidth < 768;
  const detail   = isMobile ? 12 : 50;

  const vertexShader = `
    uniform float uTime;
    uniform float uFreq;
    uniform float uAmp;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normal;
      vPosition = position;
      float displacement =
        sin(position.x * uFreq + uTime) *
        cos(position.y * uFreq + uTime) *
        sin(position.z * uFreq * 0.7 + uTime) * uAmp;
      vec3 displaced = position + normal * displacement;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
      vec3 color = mix(uColor, vec3(1.0), fresnel * 0.3);
      gl_FragColor = vec4(color, uOpacity);
    }
  `;

  function hexToVec3(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return new THREE.Vector3(r, g, b);
  }

  const blobDefs = [
    { freq: 0.8,  amp: 0.25, color: '#6E3AFF', opacity: 0.55, pos: [-2,  1, -1],  ry:  0.001,  rx:  0.0007 },
    { freq: 1.2,  amp: 0.18, color: '#00E8C8', opacity: 0.45, pos: [ 2, -1, -2],  ry: -0.0007, rx:  0.001  },
    { freq: 0.6,  amp: 0.30, color: '#1A0A3A', opacity: 0.60, pos: [ 0,  0.5, -3], ry:  0.0013, rx: -0.0005 },
  ];

  const blobs = (isMobile ? blobDefs.slice(0, 2) : blobDefs).map(def => {
    const geo = new THREE.IcosahedronGeometry(2, detail);
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime:    { value: 0 },
        uFreq:    { value: def.freq },
        uAmp:     { value: def.amp  },
        uColor:   { value: hexToVec3(def.color) },
        uOpacity: { value: def.opacity },
      },
      transparent: true,
      wireframe: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...def.pos);
    mesh.userData = { ry: def.ry, rx: def.rx };
    scene.add(mesh);
    return mesh;
  });

  // Mouse parallax
  let targetX = 0, targetY = 0;
  document.addEventListener('mousemove', e => {
    targetX = (e.clientX / window.innerWidth  - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, { passive: true });

  // Animation loop with framerate cap (min 14ms delta)
  let lastTime = 0;
  function animate(now) {
    requestAnimationFrame(animate);
    const delta = now - lastTime;
    if (delta < 14) return;
    lastTime = now;

    const t = now * 0.001;
    blobs.forEach(mesh => {
      mesh.material.uniforms.uTime.value = t;
      mesh.rotation.y += mesh.userData.ry;
      mesh.rotation.x += mesh.userData.rx;
    });

    camera.position.x += (targetX * 0.4 - camera.position.x) * 0.03;
    camera.position.y += (-targetY * 0.2 - camera.position.y) * 0.03;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
}

function showCSSFallback() {
  const canvas = document.getElementById('webgl-canvas');
  if (canvas) canvas.style.display = 'none';
  const fb = document.querySelector('.css-fallback-bg');
  if (fb) fb.style.display = 'block';
}

/* ─────────────────────────────────────────────
   16. FOOTER YEAR
───────────────────────────────────────────── */
function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ─────────────────────────────────────────────
   17. BOOTSTRAP — run everything
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initFooterYear();

  initLoader(() => {
    // Hero animations fire after loader exits
    initHeroChars(200);
    initHero();
  });

  initNavbar();
  initTypewriter();
  initCounters();
  initSkillsTabs();
  initWorkCards();
  initTestimonials();
  initTimeline();
  initScrollReveal();
  initContactForm();
  initCursor();
});

// WebGL loads async (script deferred)
window.addEventListener('load', initWebGL);

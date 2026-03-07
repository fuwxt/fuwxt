/**
 * main.js
 * ─────────────────────────────────────────────────────────────────
 * Portfolio – Muhammad Azhar Shahbaz
 *
 * Responsibilities:
 *   1. Alpine.js App() factory (theme, mobile menu)
 *   2. Lucide icon bootstrap
 *   3. Custom neon cursor
 *   4. Scroll progress bar
 *   5. Navbar scroll effect
 *   6. Typed-text animation (hero)
 *   7. Scroll-reveal (IntersectionObserver)
 *   8. Animated stat counters
 *   9. Proficiency bar animations
 *  10. Project modal open / close / keyboard trap
 *  11. Contact form handling
 *
 * Dependencies: Alpine.js, Lucide (both loaded in <head>)
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

/* ════════════════════════════════════════════════════════════════
   1. ALPINE.JS APP FACTORY
   Registered globally so x-data="App()" in <html> can find it.
════════════════════════════════════════════════════════════════ */
function App() {
  return {
    darkMode:   true,
    mobileOpen: false,

    init() {
      // Restore persisted preference
      const saved = localStorage.getItem('theme');
      this.darkMode = saved !== null ? saved === 'dark' : true;
      this._applyTheme();
    },

    toggleTheme() {
      this.darkMode = !this.darkMode;
      this._applyTheme();
      localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
    },

    _applyTheme() {
      // Alpine :class binding handles the class on <html>, but we
      // also need it on <body>'s select/option backgrounds, so just
      // keep the html class in sync for any raw CSS selectors.
      document.documentElement.classList.toggle('light-mode', !this.darkMode);
    },
  };
}

// Make App available before Alpine boots
window.App = App;


/* ════════════════════════════════════════════════════════════════
   Bootstrap — run after DOM is ready
════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // 2. Boot Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Wire everything up
  initCursor();
  initScrollProgress();
  initNavbarScroll();
  initTypedText();
  initScrollReveal();
  initStatCounters();
  initProficiencyBars();
  initModals();
  initContactForm();

});


/* ════════════════════════════════════════════════════════════════
   3. CUSTOM NEON CURSOR
════════════════════════════════════════════════════════════════ */
function initCursor() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  // On coarse-pointer devices the cursor elements are hidden via CSS —
  // skip the JS entirely to save resources.
  if (window.matchMedia('(pointer: coarse)').matches) return;

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;
  let rafId;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    // Dot follows instantly
    dot.style.left = `${mouseX}px`;
    dot.style.top  = `${mouseY}px`;
  }, { passive: true });

  // Lagging ring — smooth follow
  function animateRing() {
    ringX += (mouseX - ringX) * 0.11;
    ringY += (mouseY - ringY) * 0.11;
    ring.style.left = `${ringX}px`;
    ring.style.top  = `${ringY}px`;
    rafId = requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover effect on interactive elements
  const interactiveSelector = 'a, button, [role="button"], input, select, textarea, label';

  document.addEventListener('mouseover', e => {
    if (e.target.closest(interactiveSelector)) {
      document.body.classList.add('cursor-hover');
    }
  }, { passive: true });

  document.addEventListener('mouseout', e => {
    if (e.target.closest(interactiveSelector)) {
      document.body.classList.remove('cursor-hover');
    }
  }, { passive: true });
}


/* ════════════════════════════════════════════════════════════════
   4. SCROLL PROGRESS BAR
════════════════════════════════════════════════════════════════ */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  function update() {
    const scrolled  = window.scrollY;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = totalHeight > 0 ? (scrolled / totalHeight) * 100 : 0;
    bar.style.width = `${pct}%`;
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}


/* ════════════════════════════════════════════════════════════════
   5. NAVBAR SCROLL EFFECT
════════════════════════════════════════════════════════════════ */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function update() {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}


/* ════════════════════════════════════════════════════════════════
   6. TYPED TEXT ANIMATION (Hero)
════════════════════════════════════════════════════════════════ */
function initTypedText() {
  const el = document.getElementById('typed-output');
  if (!el) return;

  const PHRASES    = ['Graphic Designer', 'Web Developer', 'AI Creator', 'Motion Artist', 'Prompt Engineer'];
  const TYPE_SPEED = 95;   // ms per character (typing)
  const DEL_SPEED  = 55;   // ms per character (deleting)
  const PAUSE_END  = 1900; // ms to wait after full phrase
  const PAUSE_NEXT = 380;  // ms to wait after delete before next phrase

  let phraseIdx = 0;
  let charIdx   = 0;
  let deleting  = false;
  let timerId;

  function tick() {
    const phrase = PHRASES[phraseIdx];

    if (!deleting) {
      // Typing forward
      charIdx++;
      el.textContent = phrase.slice(0, charIdx);

      if (charIdx === phrase.length) {
        // Finished phrase — pause, then start deleting
        deleting = true;
        timerId = setTimeout(tick, PAUSE_END);
        return;
      }
    } else {
      // Deleting
      charIdx--;
      el.textContent = phrase.slice(0, charIdx);

      if (charIdx === 0) {
        // Finished deleting — move to next phrase
        deleting  = false;
        phraseIdx = (phraseIdx + 1) % PHRASES.length;
        timerId = setTimeout(tick, PAUSE_NEXT);
        return;
      }
    }

    timerId = setTimeout(tick, deleting ? DEL_SPEED : TYPE_SPEED);
  }

  // Small initial delay before starting
  timerId = setTimeout(tick, 800);
}


/* ════════════════════════════════════════════════════════════════
   7. SCROLL REVEAL
════════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: show everything immediately
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
      .forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target); // animate once only
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    .forEach(el => observer.observe(el));
}


/* ════════════════════════════════════════════════════════════════
   8. ANIMATED STAT COUNTERS
════════════════════════════════════════════════════════════════ */
function initStatCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const DURATION  = 2000; // ms
  const EASING    = t => 1 - Math.pow(1 - t, 3); // ease-out cubic

  function animateCounter(el) {
    const target  = parseInt(el.dataset.target, 10);
    const suffix  = el.dataset.suffix || '';
    const start   = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / DURATION, 1);
      const value    = Math.round(EASING(progress) * target);
      el.textContent = `${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(el => observer.observe(el));
}


/* ════════════════════════════════════════════════════════════════
   9. PROFICIENCY BAR ANIMATIONS
════════════════════════════════════════════════════════════════ */
function initProficiencyBars() {
  const fills = document.querySelectorAll('.prof-fill');
  if (!fills.length) return;

  if (!('IntersectionObserver' in window)) {
    fills.forEach(el => el.classList.add('animate'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  fills.forEach(el => observer.observe(el));
}


/* ════════════════════════════════════════════════════════════════
   10. PROJECT MODALS
════════════════════════════════════════════════════════════════ */
function initModals() {

  /* ── Open triggers (project CTA buttons) ── */
  document.querySelectorAll('[data-modal-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id     = btn.dataset.modalTarget;
      const modal  = document.getElementById(`modal-${id}`);
      if (modal) openModal(modal);
    });
  });

  /* ── Close buttons inside modals ── */
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) closeModal(modal);
    });
  });

  /* ── Click on backdrop (outside modal-box) closes ── */
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  /* ── Global keyboard listener ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const open = document.querySelector('.modal-overlay:not([hidden])');
      if (open) closeModal(open);
    }
  });
}

/** Open a modal: remove `hidden`, lock scroll, focus, trap Tab */
function openModal(modal) {
  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';

  // Focus the modal box for accessibility
  const box = modal.querySelector('.modal-box');
  if (box) {
    // Brief delay lets the animation start first
    setTimeout(() => box.focus(), 60);
    trapFocus(modal, box);
  }

  // Re-init any Lucide icons that were inside hidden modals
  if (window.lucide) lucide.createIcons();
}

/** Close a modal: set `hidden`, restore scroll */
function closeModal(modal) {
  modal.setAttribute('hidden', '');
  document.body.style.overflow = '';
  // Return focus to the button that opened it (nice UX)
  const id    = modal.id.replace('modal-', '');
  const opener = document.querySelector(`[data-modal-target="${id}"]`);
  if (opener) opener.focus();
}

/** Trap keyboard Tab within a modal for accessibility */
function trapFocus(overlay, box) {
  const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function onKeydown(e) {
    if (e.key !== 'Tab') return;
    if (overlay.hasAttribute('hidden')) {
      overlay.removeEventListener('keydown', onKeydown);
      return;
    }

    const focusable = Array.from(box.querySelectorAll(FOCUSABLE));
    if (!focusable.length) { e.preventDefault(); return; }

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  }

  overlay.addEventListener('keydown', onKeydown);
}


/* ════════════════════════════════════════════════════════════════
   11. CONTACT FORM
════════════════════════════════════════════════════════════════ */
function initContactForm() {
  const form       = document.getElementById('contact-form');
  const submitBtn  = document.getElementById('form-submit-btn');
  const successMsg = document.getElementById('form-success');
  const errorMsg   = document.getElementById('form-error');

  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    // Hide previous feedback
    if (successMsg) successMsg.hidden = true;
    if (errorMsg)   errorMsg.hidden   = true;

    // Basic HTML validation (novalidate lets us handle it ourselves)
    if (!form.checkValidity()) {
      if (errorMsg) errorMsg.hidden = false;
      // Focus the first invalid field
      const invalid = form.querySelector(':invalid');
      if (invalid) invalid.focus();
      return;
    }

    // Simulate async send
    if (submitBtn) {
      submitBtn.disabled = true;
      const btnSpan = submitBtn.querySelector('span');
      if (btnSpan) btnSpan.textContent = 'Sending…';
    }

    setTimeout(() => {
      form.reset();

      if (submitBtn) {
        submitBtn.disabled = false;
        const btnSpan = submitBtn.querySelector('span');
        if (btnSpan) btnSpan.textContent = 'Send Message';
      }

      if (successMsg) {
        successMsg.hidden = false;
        // Auto-hide after 5 s
        setTimeout(() => { successMsg.hidden = true; }, 5000);
      }
    }, 1600);
  });
}


/* ════════════════════════════════════════════════════════════════
   POST-ALPINE HOOK — re-create Lucide icons whenever Alpine
   updates the DOM (e.g. theme toggle swaps the icon)
════════════════════════════════════════════════════════════════ */
document.addEventListener('alpine:initialized', () => {
  if (window.lucide) lucide.createIcons();
});

// Also re-run after any Alpine mutation that might swap icon elements
document.addEventListener('alpine:mutated', () => {
  if (window.lucide) lucide.createIcons();
});

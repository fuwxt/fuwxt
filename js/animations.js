(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsObserver = 'IntersectionObserver' in window;

  function observeOnce(elements, callback, options) {
    if (!supportsObserver || reducedMotion) {
      elements.forEach(callback);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        callback(entry.target);
        observer.unobserve(entry.target);
      });
    }, options || { threshold: 0.15 });
    elements.forEach((element) => observer.observe(element));
  }

  function initUnderlines() {
    const headings = [];
    document.querySelectorAll('.section-label').forEach((label) => {
      const heading = label.nextElementSibling;
      if (heading && /^H[1-6]$/.test(heading.tagName)) {
        heading.classList.add('heading-underline');
        headings.push(heading);
      }
    });
    observeOnce(headings, (heading) => heading.classList.add('in-view'), { threshold: 0.3 });
  }

  function initPills() {
    document.querySelectorAll('.skill-pill').forEach((pill, index) => {
      pill.style.animationDelay = Math.min(index * 35, 420) + 'ms';
      if (!reducedMotion) pill.style.animationPlayState = 'paused';
    });
    observeOnce(Array.from(document.querySelectorAll('#skills .glass')), (card) => {
      card.querySelectorAll('.skill-pill').forEach((pill) => { pill.style.animationPlayState = 'running'; });
    });
  }

  function initHeroParticles() {
    const hero = document.getElementById('hero');
    if (!hero || reducedMotion || window.matchMedia('(max-width: 768px)').matches) return;
    const colors = ['#F2EAF7', '#C59DD9', '#7A3F91'];
    for (let index = 0; index < 4; index += 1) {
      const dot = document.createElement('span');
      const size = Math.random() * 3 + 2;
      const color = colors[index % colors.length];
      dot.className = 'hero-particle';
      dot.style.cssText = `left:${12 + Math.random() * 76}%;width:${size}px;height:${size}px;background:${color};box-shadow:0 0 ${size * 3}px ${color};animation-duration:${14 + Math.random() * 8}s;animation-delay:${Math.random() * 4}s`;
      hero.appendChild(dot);
    }
  }

  function initOffscreenPause() {
    if (!supportsObserver) return;
    const targets = ['hero', 'about'].map((id) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('fx-paused', !entry.isIntersecting));
    }, { threshold: 0.03 });
    targets.forEach((target) => observer.observe(target));
  }

  function initScrollspy() {
    if (!supportsObserver) return;
    const links = Array.from(document.querySelectorAll('nav a.nav-link[href^="#"]'));
    const map = new Map();
    links.forEach((link) => {
      const id = link.hash.slice(1);
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(link);
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        map.forEach((group, id) => group.forEach((link) => {
          if (id === entry.target.id) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        }));
      });
    }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });
    map.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  let initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;
    initUnderlines();
    initPills();
    initHeroParticles();
    initOffscreenPause();
    initScrollspy();
  }

  document.addEventListener('alpine:initialized', init, { once: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

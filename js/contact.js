(function() {
  /* Assemble the email address from data attributes so the page HTML
     never contains the literal `user@host` string for scrapers to grab. */
  function wireEmail() {
    var link = document.getElementById('email-link');
    if (!link) return null;
    var user = link.getAttribute('data-user');
    var host = link.getAttribute('data-host');
    if (!user || !host) return null;
    var addr = user + '@' + host;
    link.setAttribute('href', 'mailto:' + addr);
    var display = link.querySelector('[data-email-display]');
    if (display) display.textContent = addr;
    return addr;
  }

  function bindContactForm() {
    // Always wire the visible email link first — even if the form is missing.
    var addr = wireEmail();

    var form = document.getElementById('contact-form');
    if (!form) return;
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;

    // Wire form action from the same data attributes used by the visible link.
    if (addr && !form.getAttribute('action')) {
      form.setAttribute('action', 'mailto:' + addr);
    }

    form.addEventListener('submit', function(e) {
      // Use HTML5 validation instead of manual border-color tweaks
      if (!form.checkValidity()) {
        e.preventDefault();
        form.reportValidity();
        return;
      }
      // Let mailto: action proceed naturally — that opens the user's email
      // client with name/email/subject/message pre-filled.
      // Show optimistic success feedback.
      var original = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = 'Opening your email…';
      btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      setTimeout(function() {
        form.reset();
        btn.disabled = false;
        btn.innerHTML = original;
        btn.style.background = '';
        if (window.lucide) lucide.createIcons();
      }, 2500);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindContactForm);
  } else {
    bindContactForm();
  }
})();

/* ============================================================
   RESUME LINK GRACEFUL FALLBACK
   The Azhar_Resume.pdf file is not yet uploaded to the repo, so
   all 5 resume buttons would 404 on click. We HEAD-probe the URL
   once on first interaction; if it's missing, every resume link
   is rewired to scroll the user to the #contact section instead
   of hitting a 404. Once the PDF is uploaded, this code becomes
   a no-op (HEAD returns 200 → download works as expected).
============================================================ */
(function() {
  var resumeChecked = false;
  var resumeMissing = false;

  function checkOnce() {
    if (resumeChecked) return Promise.resolve(resumeMissing);
    resumeChecked = true;
    return fetch('Azhar_Resume.pdf', { method: 'HEAD' })
      .then(function(r) {
        resumeMissing = !r.ok;
        return resumeMissing;
      })
      .catch(function() { resumeMissing = true; return true; });
  }

  function rewireOne(a) {
    a.removeAttribute('download');
    a.setAttribute('href', '#contact');
    a.setAttribute('title', 'Resume not yet available — opens contact form so you can request it');
    // Update visible label text node to make the change honest
    a.childNodes.forEach(function(n) {
      if (n.nodeType === 3 && /resume|cv/i.test(n.textContent)) {
        n.textContent = ' Request Resume';
      }
    });
  }

  function rewireAll() {
    document.querySelectorAll('a[data-resume-link]').forEach(rewireOne);
  }

  document.addEventListener('click', function(e) {
    var a = e.target && e.target.closest && e.target.closest('a[data-resume-link]');
    if (!a) return;
    // If we've already determined it's missing, the rewireAll() call
    // below already fixed the href; let the click proceed naturally.
    if (resumeMissing) return;
    // First click: probe before downloading.
    e.preventDefault();
    checkOnce().then(function(missing) {
      if (missing) {
        rewireAll();
        // Smooth-scroll to contact instead of triggering a broken download.
        var contact = document.getElementById('contact');
        if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // File exists — let the original href download as intended.
        window.location.href = a.getAttribute('href');
      }
    });
  });

  // Eager probe so the labels update even before the user clicks.
  if (window.fetch) {
    checkOnce().then(function(missing) { if (missing) rewireAll(); });
  }
})();

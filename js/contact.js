/* ============================================================
   CONTACT FORM — email obfuscation + form handler
   ────────────────────────────────────────────────────────────
   Pattern:
     • The email address is split into `data-user` / `data-host`
       attributes on the visible link, so naive HTML scrapers
       can't grab `user@host` from the static markup.
     • At runtime, the script reassembles the address and wires
       it into BOTH the visible link (`href="mailto:..."`) AND
       the form's action attribute.

   Submission strategy:
     • If a real form endpoint URL is set in `window.__formEndpoint`
       (e.g. window.__formEndpoint = 'https://formspree.io/f/XXX'),
       the form posts to it via fetch() with JSON. Keeps the user
       on the page; shows inline success / error feedback.
     • Otherwise falls back to `mailto:` action (unreliable on
       desktop without a default mail client, but better than
       nothing). We detect the failure mode and show a clear
       "Open your email app or copy address" prompt.

   To switch to a hosted endpoint later, drop one line in
   index.html before this script:
     <script>window.__formEndpoint = 'https://formspree.io/f/XXX';</script>
   ============================================================ */
(function() {
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

  function showStatus(form, msg, type) {
    var slot = form.querySelector('[data-form-status]');
    if (!slot) return;
    slot.textContent = msg;
    slot.dataset.state = type || 'info';
  }

  function bindContactForm() {
    // Always wire the visible email link first — even if the form is missing.
    var addr = wireEmail();

    var form = document.getElementById('contact-form');
    if (!form) return;
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;

    var endpoint = window.__formEndpoint || form.dataset.endpoint || '';
    var hasEndpoint = !!endpoint && /^https?:\/\//.test(endpoint);

    // No live endpoint → fall back to mailto: action
    if (!hasEndpoint && addr) {
      form.setAttribute('action', 'mailto:' + addr);
      form.setAttribute('method', 'post');
      // mailto submission doesn't need x-www-form-urlencoded
      form.setAttribute('enctype', 'text/plain');
    }

    form.addEventListener('submit', function(e) {
      // Manual validation (form has no `novalidate` attr; native UI
      // shows :invalid styling, but we still call reportValidity()
      // to surface the first error before our JS path runs).
      if (!form.checkValidity()) {
        e.preventDefault();
        form.reportValidity();
        return;
      }

      var original = btn.innerHTML;
      var data = new FormData(form);

      if (hasEndpoint) {
        // POST to hosted form service (Formspree / Web3Forms / Getform).
        e.preventDefault();
        btn.disabled = true;
        btn.textContent = 'Sending…';
        showStatus(form, '', 'info');
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: data
        }).then(function(r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          form.reset();
          btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
          btn.innerHTML = original;
          showStatus(form,
            "Thanks — your message is in. I'll reply within 24 hours.",
            'success');
        }).catch(function(err) {
          console.error('[contact] submit failed:', err);
          showStatus(form,
            "Couldn't send. Please email me directly: " + (addr || 'see contact section.'),
            'error');
          btn.innerHTML = original;
        }).then(function() {
          setTimeout(function() {
            btn.disabled = false;
            btn.style.background = '';
            if (window.lucide) try { lucide.createIcons(); } catch(e) {}
          }, 600);
        });
        return;
      }

      // mailto: fallback path — let the action proceed natively.
      // Show optimistic feedback. If the user has no mail client,
      // nothing happens visibly; the inline status hint addresses that.
      btn.disabled = true;
      btn.textContent = 'Opening your email app…';
      btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      showStatus(form,
        "If your mail app didn't open, email me directly at " + (addr || 'see above.'),
        'info');
      setTimeout(function() {
        form.reset();
        btn.disabled = false;
        btn.innerHTML = original;
        btn.style.background = '';
        if (window.lucide) try { lucide.createIcons(); } catch(e) {}
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
   ────────────────────────────────────────────────────────────
   The Azhar_Resume.pdf file may not yet be uploaded to the repo,
   so all 4 resume buttons would 404 on click. We HEAD-probe the
   URL once on page load; if it's missing, every resume link is
   rewired to a `mailto:?subject=Resume%20Request` so the click
   still produces something useful (a draft email asking for the
   resume) instead of a hard 404 or a silent scroll-to-contact.

   Once the PDF is uploaded, this script becomes a no-op (HEAD
   returns 200 → download works as expected).
============================================================ */
(function() {
  var probed = false;
  var resumeMissing = false;

  function probeOnce() {
    if (probed) return Promise.resolve(resumeMissing);
    probed = true;
    if (typeof fetch !== 'function') {
      // No fetch (very old browser) — assume present, let the
      // browser surface a 404 if it really is missing.
      resumeMissing = false;
      return Promise.resolve(false);
    }
    return fetch('Azhar_Resume.pdf', { method: 'HEAD' })
      .then(function(r) { resumeMissing = !r.ok; return resumeMissing; })
      .catch(function() { resumeMissing = true; return true; });
  }

  function buildMailto() {
    var link = document.getElementById('email-link');
    var user = link && link.getAttribute('data-user');
    var host = link && link.getAttribute('data-host');
    var addr = (user && host) ? (user + '@' + host) : '';
    var subject = encodeURIComponent('Resume request — Muhammad Azhar Shahbaz');
    var body = encodeURIComponent(
      "Hi Azhar,\n\nCould you please send me a copy of your resume?\n\nThanks!"
    );
    return addr
      ? ('mailto:' + addr + '?subject=' + subject + '&body=' + body)
      : '#contact';
  }

  function rewireOne(a, mailto) {
    a.removeAttribute('download');
    a.setAttribute('href', mailto);
    a.setAttribute('title', 'Resume on request — opens an email draft');
    // Update visible label text node so the click affordance is honest
    Array.prototype.forEach.call(a.childNodes, function(n) {
      if (n.nodeType === 3 && /resume|cv/i.test(n.textContent)) {
        n.textContent = ' Request Resume';
      }
    });
  }

  function rewireAll() {
    var mailto = buildMailto();
    document.querySelectorAll('a[data-resume-link]').forEach(function(a) {
      rewireOne(a, mailto);
    });
  }

  // Eager probe so labels update even before the user clicks.
  if (window.fetch) {
    probeOnce().then(function(missing) { if (missing) rewireAll(); });
  }

  // Defensive click handler — if the eager probe hadn't completed
  // by the time someone clicks, we re-check before letting the
  // browser hit a 404.
  document.addEventListener('click', function(e) {
    var a = e.target && e.target.closest && e.target.closest('a[data-resume-link]');
    if (!a) return;
    if (resumeMissing) return;            // already rewired, let click proceed
    if (probed) return;                   // probed and present, native download
    e.preventDefault();
    probeOnce().then(function(missing) {
      if (missing) {
        rewireAll();
        window.location.href = a.getAttribute('href');
      } else {
        window.location.href = a.getAttribute('href');
      }
    });
  });
})();

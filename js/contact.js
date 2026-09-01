/* ============================================================
   CONTACT — email obfuscation
   ────────────────────────────────────────────────────────────
   The email address is split into `data-user` / `data-host`
   attributes on the visible link, so naive HTML scrapers can't
   grab `user@host` from the static markup. At runtime this
   script reassembles the address and wires it into the visible
   link (`href="mailto:..."`).

   NOTE: form submission is no longer handled here. The contact
   form POSTs to Web3Forms via fetch() inside the Alpine
   `portfolioApp().submitForm()` handler in index.html, which
   also owns the loading / success / error UI states.
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireEmail);
  } else {
    wireEmail();
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

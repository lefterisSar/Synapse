// Runs inside every facebook.com frame (see manifest `all_frames`). A browser-extension content
// script is allowed into cross-origin iframes — which ordinary page JS is not — so this can both
// (a) click the consent dialog away, and (b) measure the ad's real height and report it to the
// dashboard so each preview card can size itself to show the whole ad with no scrolling.
//
// We only act when Facebook is EMBEDDED as an iframe (our preview), not when you browse
// facebook.com directly — so bail on the top-level frame to keep the footprint tiny.
if (window.top !== window.self) {
  // --- (a) dismiss the cookie-consent dialog -----------------------------------------------------
  // Buttons Facebook shows, in preference order (decline first to minimise tracking; any dismisses
  // the wall and reveals the ad). Keep these in sync if Meta renames them.
  const LABELS = ['Decline optional cookies', 'Only allow essential cookies', 'Allow all cookies'];
  const labelOf = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim();

  const dismiss = () => {
    const candidates = document.querySelectorAll('[role="button"], button');
    for (const label of LABELS) {
      for (const el of candidates) {
        if (labelOf(el) === label) {
          el.click();
          return true;
        }
      }
    }
    return false;
  };

  if (!dismiss()) {
    const observer = new MutationObserver(() => {
      if (dismiss()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
  }

  // --- (b) report the content height to the parent dashboard -------------------------------------
  const postHeight = () => {
    const h = Math.max(
      document.body ? document.body.scrollHeight : 0,
      document.documentElement ? document.documentElement.scrollHeight : 0,
    );
    // +2px guards against a hairline crop at the bottom when the card renders scroll-free.
    if (h > 0) window.parent.postMessage({ type: 'synapse:preview-height', height: h + 2 }, '*');
  };

  postHeight();
  window.addEventListener('load', postHeight);
  if (window.ResizeObserver && document.documentElement) {
    new ResizeObserver(postHeight).observe(document.documentElement);
  }
  // A few nudges to catch late layout (image decode, consent dismissal reflow, fonts).
  [300, 800, 1500, 2500].forEach((t) => setTimeout(postHeight, t));
}

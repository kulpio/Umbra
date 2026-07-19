/**
 * Umbra waitlist config ($0 path).
 *
 * FormSubmit free AJAX endpoint (no paid account).
 * First real submit triggers a one-time activation email to the inbox —
 * Dylan must click the confirmation link before further submissions forward.
 *
 * Leave empty only for offline mock: success UI + console.log, nothing stored.
 */
window.UMBRA_WAITLIST_ACTION =
  window.UMBRA_WAITLIST_ACTION ||
  "https://formsubmit.co/ajax/d.demnard@gmail.com";

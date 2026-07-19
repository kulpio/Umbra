(function () {
  "use strict";

  // Positioning lock 2026-07-19: permissions / agents / location.
  // Legacy ?v=money|oauth|ai redirect to new keys (undocumented).
  var LEGACY = {
    money: "access",
    oauth: "access",
    ai: "agents",
  };

  var ANGLES = {
    access: {
      headline: "See every permission still open on your digital life.",
      subhead:
        "OAuth grants. Connected apps. Keys you forgot you handed out. One map. Guided revoke. Early access waitlist.",
      cta: "Map my permissions",
      bullets: [
        "Forgotten “Sign in with…” and connected-app access still live",
        "Security alerts and connection receipts that prove who still has a door",
        "Deep links to revoke — read-only first, no honeypot custody",
      ],
      title: "Permission map",
    },
    agents: {
      headline: "Your AI agents have more access than you think. Here’s the kill switch.",
      subhead:
        "Plugins, automations, assistants that read mail and files. Grant scoped. Revoke fast. Audit what they touched. Waitlist.",
      cta: "Control agent access",
      bullets: [
        "AI tools and automations still tied to your accounts",
        "Broad scopes clicked in a hurry and never reviewed",
        "A registry for agent access: grant, revoke, safe abort, audit trail",
      ],
      title: "AI agent control",
    },
    location: {
      headline: "Who can still see where you are?",
      subhead:
        "Location access, geofences, ambient sensing creep. Map geo permissions you forgot. Path toward physical consent later. No hardware on this page.",
      cta: "Check location access",
      bullets: [
        "Apps and services that still have location or geofence rights",
        "Ambient and device sensing you never meant to leave on",
        "Direction: portable consent in physical space (beacon) without claiming it ships today",
      ],
      title: "Location permissions",
    },
  };

  function qs(sel) {
    return document.querySelector(sel);
  }

  function gpcActive() {
    try {
      if (navigator.globalPrivacyControl === true) return true;
    } catch (e) {}
    return false;
  }

  function respectGpc() {
    if (!gpcActive()) return;
    document.documentElement.setAttribute("data-gpc", "1");
    window.UMBRA_ALLOW_ANALYTICS = false;
  }

  function getVariant() {
    var params = new URLSearchParams(window.location.search);
    var v = (params.get("v") || "access").toLowerCase();
    if (LEGACY[v]) v = LEGACY[v];
    if (!ANGLES[v]) v = "access";
    return v;
  }

  function applyAngle(key) {
    var a = ANGLES[key] || ANGLES.access;
    var h = qs("#hero-headline");
    var s = qs("#hero-subhead");
    var cta = qs("#hero-cta");
    var submit = qs("#submit-btn");
    var bullets = qs("#hero-bullets");
    var angleField = qs("#angle-field");

    if (h) h.textContent = a.headline;
    if (s) s.textContent = a.subhead;
    if (cta) cta.textContent = a.cta;
    if (submit) submit.textContent = a.cta;
    if (angleField) angleField.value = key;

    if (bullets) {
      bullets.innerHTML = "";
      a.bullets.forEach(function (text) {
        var li = document.createElement("li");
        li.textContent = text;
        bullets.appendChild(li);
      });
    }

    document.querySelectorAll(".angle-link").forEach(function (link) {
      var is = link.getAttribute("data-v") === key;
      link.classList.toggle("is-active", is);
      link.setAttribute("aria-current", is ? "true" : "false");
    });

    try {
      document.title = "Umbra — " + (a.title || "Permissions");
    } catch (e) {}
  }

  function detectSource() {
    var params = new URLSearchParams(window.location.search);
    var utm = params.get("utm_source");
    if (utm) return utm;
    if (document.referrer) {
      try {
        return new URL(document.referrer).hostname || "referrer";
      } catch (e) {
        return "referrer";
      }
    }
    return "direct";
  }

  function show(el, on) {
    if (!el) return;
    el.hidden = !on;
  }

  function setupForm() {
    var form = qs("#waitlist-form");
    if (!form) return;

    var success = qs("#form-success");
    var error = qs("#form-error");
    var errorText = qs("#form-error-text");
    var configHint = qs("#form-config");
    var submitBtn = qs("#submit-btn");
    var sourceField = qs("#source-field");
    if (sourceField) sourceField.value = detectSource();

    var action = (window.UMBRA_WAITLIST_ACTION || "").trim();

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      show(success, false);
      show(error, false);
      show(configHint, false);

      var emailEl = qs("#email");
      var email = emailEl && emailEl.value ? emailEl.value.trim() : "";
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (errorText) errorText.textContent = "Enter a valid email.";
        show(error, true);
        if (emailEl) emailEl.focus();
        return;
      }

      var hp =
        form.querySelector('[name="_honey"]') ||
        form.querySelector('[name="_gotcha"]');
      if (hp && hp.value) {
        show(success, true);
        form.hidden = true;
        return;
      }

      var pref = form.querySelector('input[name="preference"]:checked');
      var angle =
        (qs("#angle-field") && qs("#angle-field").value) || "access";
      var source = (sourceField && sourceField.value) || "direct";
      var gpc = gpcActive();

      var payload = {
        email: email,
        preference: pref ? pref.value : "",
        angle: angle,
        source: source,
        gpc: String(gpc),
        _subject: "Umbra waitlist",
        _template: "table",
        _captcha: "false",
        _honey: "",
        _replyto: email,
      };

      if (!action) {
        console.log("[Umbra waitlist mock]", payload);
        show(configHint, true);
        show(success, true);
        form.hidden = true;
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }

      fetch(action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        mode: "cors",
      })
        .then(function (res) {
          return res.json().then(
            function (data) {
              return { res: res, data: data };
            },
            function () {
              return { res: res, data: null };
            }
          );
        })
        .then(function (result) {
          var res = result.res;
          var data = result.data;
          var okBody =
            data &&
            (data.success === true || data.success === "true");
          if (res.ok && okBody) {
            show(success, true);
            form.hidden = true;
            return;
          }
          var detail =
            (data && (data.message || data.error)) ||
            (!res.ok ? "HTTP " + res.status : "Unexpected response");
          if (
            data &&
            typeof data.message === "string" &&
            /activat/i.test(data.message)
          ) {
            throw new Error(
              "Form needs one-time activation. Check the founder inbox for FormSubmit’s Activate link, then try again."
            );
          }
          throw new Error(detail);
        })
        .catch(function (err) {
          console.error("[Umbra waitlist]", err);
          if (errorText) {
            errorText.textContent =
              (err && err.message) ||
              "Could not reach the waitlist service. Try again, or email d.demnard@gmail.com.";
          }
          show(error, true);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent =
              (ANGLES[getVariant()] && ANGLES[getVariant()].cta) ||
              "Get early access";
          }
        });
    });
  }

  function boot() {
    respectGpc();
    var year = qs("#year");
    if (year) year.textContent = String(new Date().getFullYear());

    var v = getVariant();
    applyAngle(v);
    setupForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

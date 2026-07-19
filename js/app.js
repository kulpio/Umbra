(function () {
  "use strict";

  var ANGLES = {
    money: {
      headline:
        "Find every subscription still draining you — even the ones you forgot.",
      subhead:
        "Forgotten trials. Zombie gyms. Apps that charge quiet. Get on the list for the scan that hunts money leeches first.",
      cta: "Get early access",
      bullets: [
        "Recurring charges you stopped using but never canceled",
        "Free trials that flipped to paid while you weren’t looking",
        "Receipts and renewals buried in years of email — not just what your bank app surfaces today",
      ],
    },
    oauth: {
      headline:
        "See every app still logged into your life. Kill the ones you don’t remember.",
      subhead:
        "“Sign in with Google” from 2019 still has a key. Map the access leeches before something else does.",
      cta: "Join the waitlist",
      bullets: [
        "Old OAuth grants and “connected apps” you forgot existed",
        "Security alerts and “new sign-in” mail that prove who still has a door",
        "Guided revoke paths — read-only first, no honeypot custody",
      ],
    },
    ai: {
      headline:
        "Your AI assistants have more access than you think. Here’s the list.",
      subhead:
        "Agents, plugins, and “helpful” tools that read mail, files, and calendars. See the permission blast radius — early access waitlist.",
      cta: "Show me the waitlist",
      bullets: [
        "AI tools and automations tied to your accounts",
        "Broad scopes granted in a hurry and never reviewed",
        "A single place to inventory agent access before you grant the next one",
      ],
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

  /**
   * No third-party trackers ship by default.
   * Guard: if anything later injects non-essential scripts, skip when GPC is on.
   */
  function respectGpc() {
    if (!gpcActive()) return;
    document.documentElement.setAttribute("data-gpc", "1");
    window.UMBRA_ALLOW_ANALYTICS = false;
  }

  function getVariant() {
    var params = new URLSearchParams(window.location.search);
    var v = (params.get("v") || "money").toLowerCase();
    if (!ANGLES[v]) v = "money";
    return v;
  }

  function applyAngle(key) {
    var a = ANGLES[key] || ANGLES.money;
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
      document.title =
        "Umbra — " +
        (key === "money"
          ? "Zombie subscriptions"
          : key === "oauth"
            ? "Forgotten logins"
            : "AI permissions");
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

      // Honeypot (FormSubmit _honey + legacy _gotcha)
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
        (qs("#angle-field") && qs("#angle-field").value) || "money";
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

      // Local mock when no endpoint configured
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

      // FormSubmit AJAX expects JSON body + Accept application/json
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
          // FormSubmit returns success: "true" or similar on OK
          if (
            res.ok ||
            (data &&
              (data.success === true ||
                data.success === "true" ||
                data.message))
          ) {
            show(success, true);
            form.hidden = true;
            return;
          }
          throw new Error(
            (data && (data.message || data.error)) || "HTTP " + res.status
          );
        })
        .catch(function (err) {
          console.error("[Umbra waitlist]", err);
          if (errorText) {
            errorText.textContent =
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

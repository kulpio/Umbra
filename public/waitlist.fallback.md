# Waitlist backend ($0)

## Current production path: FormSubmit

`js/config.js` points at:

```text
https://formsubmit.co/ajax/d.demnard@gmail.com
```

- No paid Formspree account required.  
- Browser `fetch` + JSON body (see `js/app.js`).  
- Honeypot: `_honey` (empty). Captcha off (`_captcha: false`) because honeypot is present.  

### One-time human step (Dylan)

1. Submit once via the live form (or curl test).  
2. Check **d.demnard@gmail.com** for FormSubmit activation.  
3. **Click the confirmation link.**  
4. Until then, later submissions may not forward even if the page shows success.  
5. After activation, every waitlist join arrives as an email (table template).

### Fields delivered

| Field | Notes |
|---|---|
| `email` | required |
| `preference` | optional: money / logins / ai / empty |
| `angle` | money \| oauth \| ai |
| `source` | utm_source / referrer / direct |
| `gpc` | true/false |
| `_subject` | Umbra waitlist |
| `_replyto` | submitter email |

## Offline mock

Set `window.UMBRA_WAITLIST_ACTION = ""` in `config.js` → success UI + `console.log` only.

## Alternatives

Formspree / Getform / Basin / Netlify Forms — swap the URL in `config.js` and update CSP `connect-src` / `form-action` if needed.

## CAN-SPAM when you start sending mail

- Working unsubscribe  
- Publish postal address (replace interim footer line; see HTML comment `LLC_ADDRESS`)  
- No purchased lists; waitlist only  

## Privacy

No Meta/Google lookalike uploads. No ad pixels. Honor GPC.

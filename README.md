# Umbra (codename) — L0 waitlist landing

**$0 static site.** Early-access waitlist only. No live inbox scan. Leech-hunt pitch: money, zombie logins, AI permissions.

Product story later: **client-side** Gmail archaeology (read-only), not a credential honeypot.

## Live

https://kulpio.github.io/Umbra/

## Distribution gate (hard)

**Do not broadly share the public URL until:**

1. Form endpoint is live (`js/config.js` → FormSubmit — already wired for R3b), **and**  
2. A real test submit has been run, **and**  
3. Dylan has clicked FormSubmit’s **one-time activation email** (first submit only) so further signups actually forward.

Until (3), submissions may not reach the inbox even if the UI says success. **Demo/preview to individuals is fine.** Broad organic posts wait on activation confirmed.

## Quick start (local)

```bash
cd /Users/dylandemnard/Personal/Projects/Umbra
python3 -m http.server 8080
# http://127.0.0.1:8080/
```

### Angle variants

| URL | Pitch |
|---|---|
| `/` or `?v=money` | Zombie subscriptions (default) |
| `?v=oauth` | Forgotten OAuth / logins |
| `?v=ai` | AI permission blast radius |

## Waitlist

- **Production:** FormSubmit AJAX → `d.demnard@gmail.com` (`js/config.js`).  
- **Fields:** `email`, `preference`, `angle`, `source`, `gpc` (+ FormSubmit `_subject`, `_template`, `_captcha=false`, `_honey`).  
- **First submit:** FormSubmit emails a confirmation link — **must be clicked once**.  
- Empty `UMBRA_WAITLIST_ACTION` → offline mock only (no storage).  
- Details: `public/waitlist.fallback.md`.

Emails must **not** be committed under `data/`.

## Privacy / 5b

- Privacy + Terms linked before collect  
- Founder contact (interim): d.demnard@gmail.com (deletion requests too)  
- No ad pixels; CSP meta; GPC-aware  
- Postal address published before any outbound marketing mail  

## Deploy

GitHub Pages from `main` root — see `DEPLOY.md`.

## Not in this repo

- Gmail OAuth / product app  
- Paid ads  
- Trademark filing  

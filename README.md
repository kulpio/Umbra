# Umbra (codename) — L0 waitlist landing

**$0 static site.** Early-access waitlist only. No live permission scan.

**Positioning (locked 2026-07-19):** one place to **see and control permissions** — OAuth/connected access, **AI agents**, **location / geofence**. Not a subscription canceler. Inbox archaeology is a **method**, not the hero pitch.

## Live

https://kulpio.github.io/Umbra/

## Distribution gate (hard)

**Do not broadly share the public URL until:**

1. Form endpoint is live (`js/config.js` → FormSubmit), **and**  
2. A real test submit has been run, **and**  
3. Dylan has clicked FormSubmit’s **one-time activation email** so signups actually forward.

**Demo/preview to individuals is fine.** Broad organic posts wait on activation.

## Quick start (local)

```bash
cd /Users/dylandemnard/Personal/Projects/Umbra
python3 -m http.server 8080
# http://127.0.0.1:8080/
```

### Angle variants

| URL | Pitch |
|---|---|
| `/` or `?v=access` | Permission map / connected access (**default**) |
| `?v=agents` | AI agents, scoped grant, revoke, audit |
| `?v=location` | Location, geofence, ambient access direction |

Legacy `?v=money|oauth|ai` redirects in JS to access/agents (undocumented).

## Waitlist

- **Production:** FormSubmit AJAX → `d.demnard@gmail.com`  
- **Fields:** email, preference, angle, source, gpc  
- Activation email one-time; see `public/waitlist.fallback.md`  
- Empty action → local mock only  

## Privacy / 5b

- Privacy + Terms linked  
- Contact: d.demnard@gmail.com  
- No ad pixels; CSP; GPC-aware  

## Deploy

GitHub Pages from `main` — `DEPLOY.md`

## Not in this repo

- Gmail OAuth / product app  
- Paid ads  
- Live beacon hardware  

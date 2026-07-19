# Umbra app — MVP v0 (permission map)

Read-only permission map: **demo fixtures** work with zero Google setup. Optional **live Gmail** scan uses `gmail.readonly` only; mail stays in the browser; token is memory-only.

**Not** a subscription canceler. Positioning: access · AI agents · location.

## Quick start

```bash
cd app
npm install
npm test
npm run dev
```

Open http://localhost:5173 → **Run demo scan**.

```bash
npm run build   # output: app/dist
npm run preview
```

Marketing waitlist site remains at repo root (GitHub Pages). This app is primarily **localhost** for v0.

## Demo mode

- Button: **Run demo scan**
- Loads ≥8 curated findings + parser output from sample messages
- Filters: All / Access / Agents / Location / Alerts
- Detail panel + **Revoke / manage externally** (Google permissions URL etc.)
- No network required

## Live Gmail (optional)

### Security model

| Rule | v0 behavior |
|---|---|
| Scope | `gmail.readonly` (+ openid email for identity) |
| Never | `mail.google.com/`, modify, send |
| Token | **Memory only** — Disconnect clears it |
| Storage | No localStorage / IndexedDB for tokens or mail |
| Server | No Umbra backend receives message bodies |
| Revoke | Deep link only — we do not call revoke APIs |

### Google Cloud (Testing mode)

1. Create a Google Cloud project (e.g. “Umbra”).  
2. **APIs & Services → Enable Gmail API**.  
3. **OAuth consent screen**: External → **Testing**.  
4. Scopes: `https://www.googleapis.com/auth/gmail.readonly` (and openid/email if prompted).  
5. **Credentials → Create OAuth client ID → Web application**.  
6. Authorized JavaScript origins: `http://localhost:5173`  
7. Add your Google account under **Test users**.  
8. Copy Client ID into env:

```bash
cp .env.example .env.local
# edit:
# VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

9. Restart `npm run dev`. **Connect Google** → **Live Gmail scan**.

Without `VITE_GOOGLE_CLIENT_ID`, Connect stays disabled and setup copy points here. Demo still works.

### Production verification

Not in v0. Stay on Testing + ≤100 test users until CASA/verification is planned (see vault research).

## Tests

```bash
npm test
```

Parser rules: OAuth grants, connected apps, AI agents, location, security alerts. Billing-only mail must not match.

## Layout

```
src/
  model/findings.ts
  demo/fixtures.ts
  parse/          # patterns + fromMessage + tests
  auth/google.ts  # GIS token client, memory token
  gmail/          # list/get + queries
  scan/           # runDemo / runLive
  main.ts         # UI
```

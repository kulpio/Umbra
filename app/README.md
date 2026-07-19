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

### Google Cloud (Testing mode) — **Umbra project only**

**Hard rule:** create a **new** Google Cloud project named **Umbra**.  
Do **not** reuse Natandi, SynergyApp, Boreal, or any other existing GCP project. Wrong project = wrong OAuth client and cross-product mess.

1. Open **Create project**: https://console.cloud.google.com/projectcreate  
   - Project name: `Umbra`  
   - Confirm the top bar project picker says **Umbra** (not Natandi) before any next step.  
2. With **Umbra** selected → enable **Gmail API**:  
   https://console.cloud.google.com/apis/library/gmail.googleapis.com  
3. **OAuth consent screen**: External → **Testing**.  
4. Scopes: only `https://www.googleapis.com/auth/gmail.readonly` (openid/email OK if wizard adds them).  
5. **Test users**: add your Gmail.  
6. **Credentials → Create OAuth client ID → Web application**  
   - Name: `Umbra local`  
   - Authorized JavaScript origins: `http://localhost:5173` and `http://127.0.0.1:5173`  
7. Copy **that** client’s ID into env (Umbra app only — never into Natandi repos):

```bash
cd /Users/dylandemnard/Personal/Projects/Umbra/app
cp .env.example .env.local
# edit app/.env.local only:
# VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

8. Restart `npm run dev` from **Umbra/app**. **Connect Google** → **Live Gmail scan**.

Without `VITE_GOOGLE_CLIENT_ID`, Connect stays disabled. Demo still works.

**Isolation checklist**

| | Umbra | Natandi |
|--|-------|---------|
| Code | `Personal/Projects/Umbra` | `Personal/Projects/SynergyApp` |
| GCP project | **Umbra** (new) | whatever Natandi already uses |
| `.env.local` | `Umbra/app/.env.local` | Natandi env files only |
| OAuth client name | `Umbra local` | never share clients |
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

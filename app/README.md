# Umbra app — multi-surface permission map

**Product:** standing permissions across **Access · Agents · Location** (Apple, Google, Microsoft, AI, device).  
**Not** a Gmail-only scanner or subscription canceler.

**Demo is the product** while Google OAuth is parked. Gmail archaeology is an optional *method* under Sources.

## Quick start

```bash
cd app
npm install
npm test
npm run dev
```

Open http://localhost:5173 → **Load demo map**.

## Demo map (primary)

- Multi-ecosystem fixtures: SIWA, Microsoft consent, ≥5 AI agents, ≥4 location findings  
- Filters with counts: All / Access / Agents / Location / Alerts  
- Search, session dismiss, copy summary (includes ecosystem)  
- **Sources**
  - Demo data  
  - **This Mac (companion)** — pull `127.0.0.1:8787/scan` or import JSON (`howKnown: local_scan`)  
  - **Directed cloud** — mark AI cloud surfaces in use (`cloud_directed`)  
  - **Agent registry** (manual, session memory)  
  - Guided Apple & device / Location  
  - Gmail archaeology (optional / parked)  

Companion: `../companion` — see that README.

Manual agents **survive demo reload**; clear only via **Clear registry**. Page refresh loses manuals (no localStorage).

## Security bar

| Rule | Behavior |
|------|----------|
| Token | Memory only if Gmail used |
| Storage | No localStorage for tokens/mail/secrets |
| Revoke | External allowlisted HTTPS only |
| TCC | Never claimed from web app |
| Server | No mail honeypot |

## Optional live Gmail

See below only if unparking OAuth — **Umbra GCP project only**, never Natandi.

```bash
# app/.env.local
VITE_GOOGLE_CLIENT_ID=…
```

Live path: metadata prefilter then full body; debug strip counters.

## Tests

```bash
npm test && npm run build
```

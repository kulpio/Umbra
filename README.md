# Umbra (codename)

**Permissions-first** product: OAuth / connected access, AI agents, location. Not a subscription canceler.

| Surface | Path |
|---|---|
| Marketing waitlist | Repo root → https://kulpio.github.io/Umbra/ |
| **MVP app (permission map)** | [`app/`](./app/) — demo scan + optional Gmail |

## App (test this)

```bash
cd app
npm install
npm test
npm run dev
```

Open http://localhost:5173 → **Run demo scan**.

Live Gmail: see [`app/README.md`](./app/README.md) (`VITE_GOOGLE_CLIENT_ID` in `app/.env.local`).

## Marketing site (static)

```bash
python3 -m http.server 8080
# http://127.0.0.1:8080/
```

Angles: `?v=access` (default) · `agents` · `location`

## Security (app)

- Read-only · client-side parse · memory-only OAuth token  
- No mail honeypot backend  
- Scope: `gmail.readonly` only when live mode is configured  

## Docs / vault

**AI team handoff (single file):**  
`/Users/dylandemnard/DigitalBrain/Umbra/Product/TEAM-HANDOFF-NOW.md`  

(Deep dives are linked from that file — do not start from older research rounds.)

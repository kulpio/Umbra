# Umbra companion (local Mac scanner)

Read-only **local standing** scan for AI/agent-related apps, folders, LaunchAgents, and processes. Feeds the web permission map via JSON file or loopback HTTP.

## Trust model

| Rule | Behavior |
|------|----------|
| Scope | Names, paths, mtimes, process **names** only |
| Secrets | **Never** open config files or print tokens/API keys |
| Network | Scan stays local; **no upload** |
| HTTP | `serve` binds **127.0.0.1 only** |
| CORS | Only `http://localhost:5173` and `http://127.0.0.1:5173` |
| Auth | Loopback-only for v0 — anyone local can call `/scan` |

You must trust this code (open source). Do not expose port 8787 beyond loopback.

## Commands

```bash
cd companion
npm install
npm test
npm run scan          # → ./umbra-local-scan.json
npm run serve         # → http://127.0.0.1:8787
```

### Endpoints

- `GET /health` → `{ ok: true }`
- `GET /scan` → `{ findings, scannedAt, host, companionVersion }`

## Web app

1. `npm run serve` in companion  
2. App → Sources → **This Mac (companion)** → Pull from companion  
   or **Import JSON** of `umbra-local-scan.json`

## Out of scope

- TCC database, keylogging, screen capture  
- Uploading results to Umbra servers  
- Full browser profile scanning  

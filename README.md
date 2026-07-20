# Umbra (codename)

**Standing permissions map** — Access · Agents · Location across ecosystems.  
**Not** a Gmail-only scanner or subscription canceler.

| Surface | Path |
|---------|------|
| Marketing waitlist | Repo root → https://kulpio.github.io/Umbra/ |
| **Web map (demo + merge)** | [`app/`](./app/) |
| **Local Mac companion** | [`companion/`](./companion/) |

## App

```bash
cd app && npm install && npm run dev
# Load demo map · Agent registry · Directed cloud · This Mac (companion)
```

## Companion (this Mac)

```bash
cd companion && npm install
npm run scan    # → umbra-local-scan.json
npm run serve   # http://127.0.0.1:8787  GET /scan
```

Then in the app: **Sources → This Mac → Pull from companion** (or Import JSON).

Trust: read-only names/paths; no config secrets; loopback only. See `companion/README.md`.

## Optional Gmail

Parked. See `app/README.md` if unparking (Umbra GCP project only).

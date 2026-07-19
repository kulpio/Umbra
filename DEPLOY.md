# Deploy Umbra waitlist ($0)

## Primary: GitHub Pages

### One-time (CLI, if `gh` is logged in)

```bash
cd /Users/dylandemnard/Personal/Projects/Umbra

# Create public repo under the authenticated GitHub user (or org)
gh repo create Umbra --public --source=. --remote=origin --push

# Enable Pages from main branch, root
gh api -X POST "repos/$(gh api user -q .login)/Umbra/pages" \
  -f build_type=legacy \
  -f source[branch]=main \
  -f source[path]=/
```

If the API shape fails, enable in the UI:

1. Repo → **Settings** → **Pages**  
2. Source: **Deploy from a branch**  
3. Branch: `main` / `/ (root)` → Save  

Live URL pattern:

```
https://<github-username>.github.io/Umbra/
```

(If the repo is named `Umbra`, path includes `/Umbra/` unless you use a `username.github.io` user site.)

### Subsequent updates

```bash
git add -A && git commit -m "Update landing" && git push
```

Pages rebuilds in ~1 minute.

### Optional: project site base path

If assets 404 under `/Umbra/`, ensure relative paths (`css/…`, `js/…`) — this repo already uses **relative** URLs.

---

## Alternative: Cloudflare Pages

1. https://pages.cloudflare.com → Create project → Upload assets **or** connect Git.  
2. Build command: none · Output directory: `/` (or project root).  
3. Free `*.pages.dev` URL.  
4. Optional: enable **Cloudflare Web Analytics** (privacy-friendly) in the CF dashboard — no cookie wall. Skip if GPC-sensitive and you prefer zero third-party scripts.

```bash
# If wrangler is installed and logged in:
# npx wrangler pages deploy . --project-name=umbra-waitlist
```

---

## Wire waitlist after first deploy

1. Create free Formspree form.  
2. Set `window.UMBRA_WAITLIST_ACTION` in `js/config.js`.  
3. Commit + push.  
4. Test a real submit (use your email).  

Until then, the live page still works for demos: mock success + console only.

---

## Checklist before public share

- [ ] Pages URL loads on mobile  
- [ ] `?v=money` / `oauth` / `ai` swap copy  
- [ ] Form success path works (mock or Formspree)  
- [ ] Privacy + Terms linked  
- [ ] No ad pixels  
- [ ] Replace `[LLC_ADDRESS]` when mailing starts  

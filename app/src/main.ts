import "./style.css";
import type { Finding } from "./model/findings";
import {
  confidenceLabel,
  kindToBucket,
  safeRevokeUrl,
  sourceLabel,
} from "./model/findings";
import {
  connectGoogle,
  disconnect,
  getAuthEmail,
  hasClientId,
  isConnected,
} from "./auth/google";
import { emptyScanStats, type ScanStats } from "./gmail/client";
import {
  bucketCountsForChips,
  exportMapSummary,
  type MapFilter,
  visibleFindings,
} from "./map/filter";
import { runDemoScan } from "./scan/runDemo";
import { demoScanStats, runLiveScan } from "./scan/runLive";

type Mode = "idle" | "demo" | "live";

let findings: Finding[] = [];
/** Session-memory only — never localStorage/IndexedDB */
let dismissed = new Set<string>();
let showDismissed = false;
let searchQuery = "";
let filter: MapFilter = "all";
let selectedId: string | null = null;
let mode: Mode = "idle";
let lastStats: ScanStats = emptyScanStats();
let debugOpen = false;
let statusText =
  "Demo is the product for now (Google OAuth parked). Run Demo scan — no account needed.";
let statusKind: "ok" | "error" | "info" | "" = "info";
let busy = false;
let copyFlash = "";

const app = document.querySelector<HTMLDivElement>("#app")!;

function clearDismissals() {
  dismissed = new Set();
  showDismissed = false;
}

function selected(): Finding | null {
  return findings.find((f) => f.id === selectedId) || null;
}

function setStatus(
  text: string,
  kind: "ok" | "error" | "info" | "" = "",
) {
  statusText = text;
  statusKind = kind;
  render();
}

function setBusy(v: boolean) {
  busy = v;
  render();
}

function visible(): Finding[] {
  return visibleFindings(findings, {
    dismissed,
    showDismissed,
    filter,
    search: searchQuery,
  });
}

function chipCounts() {
  return bucketCountsForChips(findings, {
    dismissed,
    showDismissed,
    search: searchQuery,
  });
}

async function onDemo() {
  setBusy(true);
  try {
    clearDismissals();
    findings = runDemoScan();
    mode = "demo";
    lastStats = demoScanStats(findings.length);
    selectedId = visible()[0]?.id ?? findings[0]?.id ?? null;
    const c = chipCounts();
    setStatus(
      `Demo mode: ${findings.length} findings (fixtures + parsers). Not your inbox. Visible now: ${visible().length}. Buckets: access ${c.access} · agents ${c.agents} · location ${c.location} · alerts ${c.alerts}.`,
      "ok",
    );
  } catch (e) {
    setStatus(e instanceof Error ? e.message : String(e), "error");
  } finally {
    setBusy(false);
  }
}

async function onConnect() {
  if (!hasClientId()) {
    setStatus(
      "Google OAuth is parked. Demo scan is the product. When ready: VITE_GOOGLE_CLIENT_ID in app/.env.local (Umbra GCP project only) — see app/README.md.",
      "info",
    );
    return;
  }
  setBusy(true);
  try {
    const auth = await connectGoogle();
    setStatus(
      `Connected${auth.email ? ` as ${auth.email}` : ""}. Scope: gmail.readonly. Token memory-only. Run Live Gmail scan when ready.`,
      "ok",
    );
  } catch (e) {
    setStatus(e instanceof Error ? e.message : String(e), "error");
  } finally {
    setBusy(false);
  }
}

async function onLiveScan() {
  if (!isConnected()) {
    setStatus(
      "Connect Google first (when OAuth is unparked), or use Demo scan.",
      "error",
    );
    return;
  }
  setBusy(true);
  try {
    clearDismissals();
    const result = await runLiveScan();
    findings = result.findings;
    lastStats = result.stats;
    mode = "live";
    selectedId = visible()[0]?.id ?? null;
    setStatus(
      findings.length
        ? `Live: ${findings.length} findings. Bodies fetched: ${lastStats.bodiesFetched} of ${lastStats.candidatesListed} candidates (metadata prefilter). On this device only.`
        : `Live scan: zero parsed findings. Listed ${lastStats.candidatesListed}, full bodies ${lastStats.bodiesFetched}. Try Demo scan to explore UI.`,
      "ok",
    );
  } catch (e) {
    setStatus(e instanceof Error ? e.message : String(e), "error");
  } finally {
    setBusy(false);
  }
}

function onDisconnect() {
  disconnect();
  clearDismissals();
  if (mode === "live") {
    findings = [];
    selectedId = null;
    mode = "idle";
    lastStats = emptyScanStats();
  }
  setStatus(
    "Disconnected. Token cleared. Dismissals cleared. Reload demo with Demo scan if needed.",
    "ok",
  );
}

function onDismiss(id: string) {
  dismissed.add(id);
  if (selectedId === id) selectedId = null;
  render();
}

function onRestore(id: string) {
  dismissed.delete(id);
  render();
}

async function onCopySummary() {
  const rows = visible();
  const text = exportMapSummary(rows, "text");
  try {
    await navigator.clipboard.writeText(text);
    copyFlash = `Copied ${rows.length} visible findings (no email bodies).`;
  } catch {
    copyFlash = "Clipboard blocked — summary printed to console.";
    console.log(text);
  }
  render();
  window.setTimeout(() => {
    copyFlash = "";
    render();
  }, 2500);
}

function renderDetail(f: Finding | null): string {
  if (!f) {
    if (!findings.length) {
      return `<div class="empty">
        <p><strong>No finding selected.</strong></p>
        <p>Run <strong>Demo scan</strong> — sample OAuth, agents, location, alerts (no Google).</p>
        <p class="muted-line">Revoke is always external. Umbra is a read-only map.</p>
      </div>`;
    }
    return `<div class="empty">Select a row for confidence, evidence, dismiss, and external manage link.</div>`;
  }
  const isGone = dismissed.has(f.id);
  const safe = safeRevokeUrl(f.revokeUrl);
  const revoke = safe
    ? `<p><a class="btn external" href="${escapeAttr(safe)}" target="_blank" rel="noopener noreferrer">Open external manage / revoke page</a></p>
       <p class="setup">Leaves Umbra. We do not call revoke APIs.</p>`
    : `<p class="setup">No safe external manage URL. Open Google Account permissions manually.</p>`;

  const dismissBtn = isGone
    ? `<button type="button" class="ghost" id="btn-restore" data-id="${escapeAttr(f.id)}">Restore (undo dismiss)</button>`
    : `<button type="button" class="ghost" id="btn-dismiss" data-id="${escapeAttr(f.id)}">Not relevant / dismiss</button>`;

  return `
    <div class="detail">
      <h3>${escapeHtml(f.title)}</h3>
      <p class="mode-chip">${escapeHtml(sourceLabel(f.source))}${isGone ? " · dismissed this session" : ""}</p>
      <dl>
        <div><dt>Party</dt><dd>${escapeHtml(f.party)}</dd></div>
        <div><dt>Kind</dt><dd><span class="kind">${escapeHtml(f.kind)}</span> · <code>${escapeHtml(kindToBucket(f.kind))}</code></dd></div>
        <div><dt>Confidence</dt><dd>${escapeHtml(f.confidence)} — ${escapeHtml(confidenceLabel(f.confidence))}</dd></div>
        <div><dt>When</dt><dd>${f.evidenceDate ? escapeHtml(f.evidenceDate) : "Unknown"}</dd></div>
        <div><dt>Summary</dt><dd>${escapeHtml(f.summary)}</dd></div>
        ${f.rawSubject ? `<div><dt>Evidence subject</dt><dd class="mono">${escapeHtml(f.rawSubject)}</dd></div>` : ""}
      </dl>
      <div class="detail-actions">${dismissBtn}</div>
      ${revoke}
    </div>`;
}

function renderList(items: Finding[]): string {
  if (!findings.length) {
    return `<div class="empty">
      <p><strong>Empty map.</strong></p>
      <p>Use <strong>Demo scan</strong> (Google not required).</p>
      <p class="muted-line">Live Gmail is parked until OAuth is configured. Search, dismiss, and export work on demo data.</p>
    </div>`;
  }
  if (!items.length) {
    return `<div class="empty">
      <p>No rows match this filter/search${showDismissed ? "" : " (dismissed hidden)"}.</p>
      <p class="muted-line">${findings.length} total · ${dismissed.size} dismissed this session. Try All, clear search, or Show dismissed.</p>
    </div>`;
  }
  return `<ul class="list">${items
    .map((f) => {
      const sel = f.id === selectedId ? " selected" : "";
      const dim = dismissed.has(f.id) ? " dismissed-row" : "";
      return `<li>
        <button type="button" class="row${sel}${dim}" data-id="${escapeAttr(f.id)}">
          <span class="kind">${escapeHtml(f.kind)}</span>
          <span class="row-title">${escapeHtml(f.title)}</span>
          <span class="row-meta">${escapeHtml(f.party)} · conf ${escapeHtml(f.confidence)}${f.evidenceDate ? ` · ${escapeHtml(f.evidenceDate)}` : ""} · ${escapeHtml(f.source)}</span>
        </button>
      </li>`;
    })
    .join("")}</ul>`;
}

function filterBtn(id: MapFilter, label: string, n: number): string {
  return `<button type="button" data-filter="${id}" class="${filter === id ? "active" : ""}">${label} <span class="chip-n">${n}</span></button>`;
}

function modeBanner(): string {
  if (mode === "demo") {
    return `<div class="banner demo">Showing <strong>demo</strong> data — not your real inbox. Dismissals last this session only.</div>`;
  }
  if (mode === "live") {
    return `<div class="banner live">Showing <strong>live</strong> Gmail parse (this device). Disconnect clears token + dismissals for live data.</div>`;
  }
  return `<div class="banner idle">Demo-first: permission map for access · agents · location. Google OAuth parked — use Demo scan.</div>`;
}

function debugStrip(): string {
  const s = lastStats;
  return `
    <details class="debug" ${debugOpen ? "open" : ""}>
      <summary>Debug · live calibration (candidates / bodies / parsed)</summary>
      <ul>
        <li>candidates listed: <strong>${s.candidatesListed}</strong></li>
        <li>metadata fetched: <strong>${s.metadataFetched}</strong></li>
        <li>prefilter passed: <strong>${s.prefilterPassed}</strong></li>
        <li>bodies (full) fetched: <strong>${s.bodiesFetched}</strong></li>
        <li>parsed findings: <strong>${s.parsed}</strong></li>
        <li>unmatched / skipped: <strong>${s.unmatched}</strong></li>
      </ul>
      <p class="muted-line">Live path uses format=metadata then full only if subject/from/snippet prefilter hits. Demo sets parsed = finding count.</p>
    </details>`;
}

function render() {
  const items = visible();
  const counts = chipCounts();
  const clientConfigured = hasClientId();
  const connected = isConnected();

  app.innerHTML = `
    <header class="topbar">
      <div>
        <div class="brand">Umbra <span class="badge">codename · MVP v0</span></div>
        <p class="honesty">
          Read-only · on this device · not a mail honeypot ·
          disconnect clears token · revoke external only · dismiss session-only
        </p>
      </div>
      <div class="actions">
        <button type="button" class="primary" id="btn-demo" ${busy ? "disabled" : ""}>Demo scan</button>
        <button type="button" id="btn-connect" ${busy ? "disabled" : ""} title="Parked unless client id set">
          ${connected ? "Re-auth Google" : "Connect Google"}
        </button>
        <button type="button" id="btn-live" ${busy || !connected ? "disabled" : ""}>Live Gmail scan</button>
        <button type="button" class="ghost" id="btn-disconnect" ${busy || !connected ? "disabled" : ""}>Disconnect</button>
        <button type="button" class="ghost" id="btn-copy" ${busy || !findings.length ? "disabled" : ""}>Copy map summary</button>
      </div>
    </header>

    ${modeBanner()}

    <div class="status ${statusKind}" id="status">${escapeHtml(statusText)}</div>
    ${copyFlash ? `<p class="flash">${escapeHtml(copyFlash)}</p>` : ""}
    ${
      !clientConfigured
        ? `<p class="setup"><strong>Demo is the product</strong> while Google OAuth is parked. Live path code is ready for later (Umbra GCP project only).</p>`
        : connected
          ? `<p class="setup">Signed in${getAuthEmail() ? ` as <code>${escapeHtml(getAuthEmail()!)}</code>` : ""}. <code>gmail.readonly</code> · token memory-only.</p>`
          : `<p class="setup">Client id present. Connect only if you intend a live read-only scan.</p>`
    }

    ${debugStrip()}

    <div class="layout">
      <section class="panel">
        <h2>Permission map <span class="count">${items.length} shown · ${findings.length} total · ${dismissed.size} dismissed</span></h2>
        <div class="toolbar">
          <label class="search-label">
            <span class="sr-only">Search</span>
            <input type="search" id="search" placeholder="Search party or title…" value="${escapeAttr(searchQuery)}" autocomplete="off" />
          </label>
          <label class="check">
            <input type="checkbox" id="show-dismissed" ${showDismissed ? "checked" : ""} />
            Show dismissed
          </label>
        </div>
        <div class="filters">
          ${filterBtn("all", "All", counts.all)}
          ${filterBtn("access", "Access", counts.access)}
          ${filterBtn("agents", "Agents", counts.agents)}
          ${filterBtn("location", "Location", counts.location)}
          ${filterBtn("alerts", "Alerts", counts.alerts)}
        </div>
        ${renderList(items)}
      </section>
      <section class="panel">
        <h2>Detail</h2>
        ${renderDetail(selected())}
      </section>
    </div>

    <p class="footer-note">
      Standing permission map — not a subscription canceler. Export copies visible rows only (no bodies).
    </p>
  `;

  document.getElementById("btn-demo")?.addEventListener("click", () => void onDemo());
  document.getElementById("btn-connect")?.addEventListener("click", () => void onConnect());
  document.getElementById("btn-live")?.addEventListener("click", () => void onLiveScan());
  document.getElementById("btn-disconnect")?.addEventListener("click", onDisconnect);
  document.getElementById("btn-copy")?.addEventListener("click", () => void onCopySummary());

  const searchEl = document.getElementById("search") as HTMLInputElement | null;
  searchEl?.addEventListener("input", () => {
    searchQuery = searchEl.value;
    render();
    const again = document.getElementById("search") as HTMLInputElement | null;
    if (again) {
      again.focus();
      const len = again.value.length;
      again.setSelectionRange(len, len);
    }
  });

  document.getElementById("show-dismissed")?.addEventListener("change", (e) => {
    showDismissed = (e.target as HTMLInputElement).checked;
    render();
  });

  document.querySelector("details.debug")?.addEventListener("toggle", (e) => {
    debugOpen = (e.target as HTMLDetailsElement).open;
  });

  app.querySelectorAll<HTMLButtonElement>("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      filter = btn.dataset.filter as MapFilter;
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>(".row[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedId = btn.dataset.id || null;
      render();
    });
  });

  document.getElementById("btn-dismiss")?.addEventListener("click", () => {
    const id = document.getElementById("btn-dismiss")?.getAttribute("data-id");
    if (id) onDismiss(id);
  });
  document.getElementById("btn-restore")?.addEventListener("click", () => {
    const id = document.getElementById("btn-restore")?.getAttribute("data-id");
    if (id) onRestore(id);
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

render();

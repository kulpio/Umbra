import "./style.css";
import type { Finding, FindingBucket } from "./model/findings";
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
import { runDemoScan } from "./scan/runDemo";
import { runLiveScan } from "./scan/runLive";

type Filter = "all" | FindingBucket;
type Mode = "idle" | "demo" | "live";

let findings: Finding[] = [];
let filter: Filter = "all";
let selectedId: string | null = null;
let mode: Mode = "idle";
let statusText =
  "Start with Demo scan (no Google). Live Gmail is optional and read-only on this device.";
let statusKind: "ok" | "error" | "info" | "" = "info";
let busy = false;

const app = document.querySelector<HTMLDivElement>("#app")!;

function filtered(): Finding[] {
  if (filter === "all") return findings;
  return findings.filter((f) => kindToBucket(f.kind) === filter);
}

function selected(): Finding | null {
  return findings.find((f) => f.id === selectedId) || null;
}

function bucketCounts(list: Finding[]): string {
  const c = { access: 0, agents: 0, location: 0, alerts: 0 };
  for (const f of list) c[kindToBucket(f.kind)]++;
  return `access ${c.access} · agents ${c.agents} · location ${c.location} · alerts ${c.alerts}`;
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

async function onDemo() {
  setBusy(true);
  try {
    findings = runDemoScan();
    mode = "demo";
    selectedId = findings[0]?.id ?? null;
    setStatus(
      `Demo mode: ${findings.length} findings from fixtures + sample-mail parsers. Not your inbox. (${bucketCounts(findings)})`,
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
      "Live Gmail needs VITE_GOOGLE_CLIENT_ID in app/.env.local (Google Testing OAuth). Demo scan works without it — see app/README.md.",
      "error",
    );
    return;
  }
  setBusy(true);
  try {
    const auth = await connectGoogle();
    setStatus(
      `Connected${auth.email ? ` as ${auth.email}` : ""}. Scope: gmail.readonly. Token only in memory — not stored. Run Live Gmail scan when ready.`,
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
    setStatus("Connect Google first, or use Demo scan without an account.", "error");
    return;
  }
  setBusy(true);
  try {
    findings = await runLiveScan();
    mode = "live";
    selectedId = findings[0]?.id ?? null;
    setStatus(
      findings.length
        ? `Live mode: ${findings.length} permission-related findings from your Gmail. Parsed on this device only. (${bucketCounts(findings)})`
        : "Live scan finished with zero matches in the search window. That can be normal — not every inbox has OAuth/security mail in range. Try Demo scan to explore the UI.",
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
  if (mode === "live") {
    findings = [];
    selectedId = null;
    mode = "idle";
  }
  setStatus(
    "Disconnected. Access token cleared from memory. Demo findings (if any) can be reloaded with Demo scan.",
    "ok",
  );
}

function renderDetail(f: Finding | null): string {
  if (!f) {
    if (!findings.length) {
      return `<div class="empty">
        <p><strong>No finding selected.</strong></p>
        <p>Run <strong>Demo scan</strong> to load a sample permission map (OAuth, agents, location, alerts).</p>
        <p class="muted-line">Live Gmail is optional. Umbra never revokes for you — only deep-links to Google or vendor settings.</p>
      </div>`;
    }
    return `<div class="empty">Select a row in the map to see confidence, evidence, and an external manage link.</div>`;
  }
  const safe = safeRevokeUrl(f.revokeUrl);
  const revoke = safe
    ? `<p><a class="btn external" href="${escapeAttr(safe)}" target="_blank" rel="noopener noreferrer">Open external manage / revoke page</a></p>
       <p class="setup">Leaves Umbra. We do not call revoke APIs. Read-only map only.</p>`
    : `<p class="setup">No safe external manage URL for this row. Review Google Account permissions manually.</p>`;

  return `
    <div class="detail">
      <h3>${escapeHtml(f.title)}</h3>
      <p class="mode-chip">${escapeHtml(sourceLabel(f.source))}</p>
      <dl>
        <div><dt>Party</dt><dd>${escapeHtml(f.party)}</dd></div>
        <div><dt>Kind</dt><dd><span class="kind">${escapeHtml(f.kind)}</span> · bucket <code>${escapeHtml(kindToBucket(f.kind))}</code></dd></div>
        <div><dt>Confidence</dt><dd>${escapeHtml(f.confidence)} — ${escapeHtml(confidenceLabel(f.confidence))}</dd></div>
        <div><dt>When</dt><dd>${f.evidenceDate ? escapeHtml(f.evidenceDate) : "Unknown"}</dd></div>
        <div><dt>Summary</dt><dd>${escapeHtml(f.summary)}</dd></div>
        ${f.rawSubject ? `<div><dt>Evidence subject</dt><dd class="mono">${escapeHtml(f.rawSubject)}</dd></div>` : ""}
      </dl>
      ${revoke}
    </div>`;
}

function renderList(items: Finding[]): string {
  if (!findings.length) {
    return `<div class="empty">
      <p><strong>Empty map.</strong></p>
      <p>Use <strong>Demo scan</strong> for sample access / agents / location findings (no Google).</p>
      <p class="muted-line">Or connect Google (Testing OAuth) and run <strong>Live Gmail scan</strong> — mail stays in the browser.</p>
    </div>`;
  }
  if (!items.length) {
    return `<div class="empty">
      <p>No findings in this filter.</p>
      <p class="muted-line">Try <strong>All</strong>, or another bucket. ${findings.length} total on the map.</p>
    </div>`;
  }
  return `<ul class="list">${items
    .map((f) => {
      const sel = f.id === selectedId ? " selected" : "";
      return `<li>
        <button type="button" class="row${sel}" data-id="${escapeAttr(f.id)}">
          <span class="kind">${escapeHtml(f.kind)}</span>
          <span class="row-title">${escapeHtml(f.title)}</span>
          <span class="row-meta">${escapeHtml(f.party)} · conf ${escapeHtml(f.confidence)} · ${escapeHtml(f.source)}</span>
        </button>
      </li>`;
    })
    .join("")}</ul>`;
}

function filterBtn(id: Filter, label: string): string {
  return `<button type="button" data-filter="${id}" class="${filter === id ? "active" : ""}">${label}</button>`;
}

function modeBanner(): string {
  if (mode === "demo") {
    return `<div class="banner demo">Showing <strong>demo</strong> data — not your real inbox.</div>`;
  }
  if (mode === "live") {
    return `<div class="banner live">Showing <strong>live</strong> parse of your Gmail (this device). Disconnect clears the token.</div>`;
  }
  return `<div class="banner idle">No scan loaded yet. Permission map: access · agents · location (not bills or subscriptions).</div>`;
}

function render() {
  const items = filtered();
  const clientConfigured = hasClientId();
  const connected = isConnected();

  app.innerHTML = `
    <header class="topbar">
      <div>
        <div class="brand">Umbra <span class="badge">codename · MVP v0</span></div>
        <p class="honesty">
          Read-only · on this device · not a mail honeypot ·
          disconnect clears token · revoke is external only
        </p>
      </div>
      <div class="actions">
        <button type="button" class="primary" id="btn-demo" ${busy ? "disabled" : ""} title="Sample findings, no Google">Demo scan</button>
        <button type="button" id="btn-connect" ${busy || !clientConfigured ? "disabled" : ""} title="gmail.readonly, memory token">
          ${connected ? "Re-auth Google" : "Connect Google"}
        </button>
        <button type="button" id="btn-live" ${busy || !connected ? "disabled" : ""} title="Scan Gmail for permission signals">Live Gmail scan</button>
        <button type="button" class="ghost" id="btn-disconnect" ${busy || !connected ? "disabled" : ""}>Disconnect</button>
      </div>
    </header>

    ${modeBanner()}

    <div class="status ${statusKind}" id="status">${escapeHtml(statusText)}</div>
    ${
      !clientConfigured
        ? `<p class="setup"><strong>Demo is enough to test the product.</strong> Live Gmail: set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>app/.env.local</code> (Google Cloud Testing mode). See <code>app/README.md</code>.</p>`
        : connected
          ? `<p class="setup">Signed in${getAuthEmail() ? ` as <code>${escapeHtml(getAuthEmail()!)}</code>` : ""}. Scope: <code>gmail.readonly</code> only. Token memory-only.</p>`
          : `<p class="setup">Google client id present. Connect when you want a live read-only scan.</p>`
    }

    <div class="layout">
      <section class="panel">
        <h2>Permission map <span class="count">${items.length}${filter !== "all" ? ` / ${findings.length}` : ""}</span></h2>
        <div class="filters">
          ${filterBtn("all", "All")}
          ${filterBtn("access", "Access")}
          ${filterBtn("agents", "Agents")}
          ${filterBtn("location", "Location")}
          ${filterBtn("alerts", "Alerts")}
        </div>
        ${renderList(items)}
      </section>
      <section class="panel">
        <h2>Detail</h2>
        ${renderDetail(selected())}
      </section>
    </div>

    <p class="footer-note">
      Standing permission map — OAuth, connected apps, AI agents, location signals.
      Not a subscription canceler. Marketing waitlist is separate (repo root / GitHub Pages).
    </p>
  `;

  document.getElementById("btn-demo")?.addEventListener("click", () => void onDemo());
  document.getElementById("btn-connect")?.addEventListener("click", () => void onConnect());
  document.getElementById("btn-live")?.addEventListener("click", () => void onLiveScan());
  document.getElementById("btn-disconnect")?.addEventListener("click", onDisconnect);

  app.querySelectorAll<HTMLButtonElement>("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      filter = btn.dataset.filter as Filter;
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>(".row[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedId = btn.dataset.id || null;
      render();
    });
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

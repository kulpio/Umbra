import "./style.css";
import type { Finding, FindingBucket } from "./model/findings";
import { kindToBucket } from "./model/findings";
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

let findings: Finding[] = [];
let filter: Filter = "all";
let selectedId: string | null = null;
let statusText = "Load demo fixtures or connect Google (read-only) to scan.";
let statusKind: "ok" | "error" | "" = "";
let busy = false;

const app = document.querySelector<HTMLDivElement>("#app")!;

function filtered(): Finding[] {
  if (filter === "all") return findings;
  return findings.filter((f) => kindToBucket(f.kind) === filter);
}

function selected(): Finding | null {
  return findings.find((f) => f.id === selectedId) || null;
}

function setStatus(text: string, kind: "ok" | "error" | "" = "") {
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
    selectedId = findings[0]?.id ?? null;
    setStatus(
      `Demo scan: ${findings.length} findings (fixtures + parsers). No Google account used.`,
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
      "Set VITE_GOOGLE_CLIENT_ID in app/.env.local (see README). Demo mode works without it.",
      "error",
    );
    return;
  }
  setBusy(true);
  try {
    const auth = await connectGoogle();
    setStatus(
      `Connected${auth.email ? ` as ${auth.email}` : ""}. Token in memory only. Run live scan when ready.`,
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
    setStatus("Connect Google first (or use Demo scan).", "error");
    return;
  }
  setBusy(true);
  try {
    findings = await runLiveScan();
    selectedId = findings[0]?.id ?? null;
    setStatus(
      findings.length
        ? `Live scan: ${findings.length} permission-related findings. Bodies stayed on this device.`
        : "Live scan finished: no matching permission signals in the searched window. Inbox may simply lack those mails.",
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
  setStatus("Disconnected. Access token cleared from memory.", "ok");
}

function renderDetail(f: Finding | null): string {
  if (!f) {
    return `<div class="empty">Select a finding to see details and manage links.</div>`;
  }
  const revoke = f.revokeUrl
    ? `<p><a class="btn" href="${escapeAttr(f.revokeUrl)}" target="_blank" rel="noopener noreferrer">Revoke / manage externally</a></p>
       <p class="setup">Opens vendor or Google account UI. Umbra does not revoke for you (read-only).</p>`
    : "";
  return `
    <div class="detail">
      <h3>${escapeHtml(f.title)}</h3>
      <dl>
        <div><dt>Party</dt><dd>${escapeHtml(f.party)}</dd></div>
        <div><dt>Kind</dt><dd><span class="kind">${escapeHtml(f.kind)}</span></dd></div>
        <div><dt>Confidence</dt><dd>${escapeHtml(f.confidence)}</dd></div>
        <div><dt>Source</dt><dd>${escapeHtml(f.source)}${f.evidenceDate ? ` · ${escapeHtml(f.evidenceDate)}` : ""}</dd></div>
        <div><dt>Summary</dt><dd>${escapeHtml(f.summary)}</dd></div>
        ${f.rawSubject ? `<div><dt>Evidence subject</dt><dd>${escapeHtml(f.rawSubject)}</dd></div>` : ""}
      </dl>
      ${revoke}
    </div>`;
}

function renderList(items: Finding[]): string {
  if (!items.length) {
    return `<div class="empty">No findings yet. Run <strong>Demo scan</strong> to load the permission map.</div>`;
  }
  return `<ul class="list">${items
    .map((f) => {
      const sel = f.id === selectedId ? " selected" : "";
      return `<li>
        <button type="button" class="row${sel}" data-id="${escapeAttr(f.id)}">
          <span class="kind">${escapeHtml(f.kind)}</span>
          <span class="row-title">${escapeHtml(f.title)}</span>
          <span class="row-meta">${escapeHtml(f.party)} · ${escapeHtml(f.confidence)} · ${escapeHtml(f.source)}</span>
        </button>
      </li>`;
    })
    .join("")}</ul>`;
}

function filterBtn(id: Filter, label: string): string {
  return `<button type="button" data-filter="${id}" class="${filter === id ? "active" : ""}">${label}</button>`;
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
          Read-only · processed on this device · not a mail honeypot ·
          disconnect clears the token · no live revoke API
        </p>
      </div>
      <div class="actions">
        <button type="button" class="primary" id="btn-demo" ${busy ? "disabled" : ""}>Run demo scan</button>
        <button type="button" id="btn-connect" ${busy || !clientConfigured ? "disabled" : ""}>
          ${connected ? "Re-auth Google" : "Connect Google"}
        </button>
        <button type="button" id="btn-live" ${busy || !connected ? "disabled" : ""}>Live Gmail scan</button>
        <button type="button" class="ghost" id="btn-disconnect" ${busy || !connected ? "disabled" : ""}>Disconnect</button>
      </div>
    </header>

    <div class="status ${statusKind}" id="status">${escapeHtml(statusText)}</div>
    ${
      !clientConfigured
        ? `<p class="setup">Live Gmail: set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>app/.env.local</code> (Testing mode OAuth client). See <code>app/README.md</code>. Demo works without it.</p>`
        : connected
          ? `<p class="setup">Signed in${getAuthEmail() ? ` as <code>${escapeHtml(getAuthEmail()!)}</code>` : ""}. Scope: gmail.readonly. Token memory-only.</p>`
          : `<p class="setup">Google client configured. Connect to scan your inbox client-side.</p>`
    }

    <div class="layout">
      <section class="panel">
        <h2>Permission map (${items.length})</h2>
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
      Permissions / agents / location — not a subscription canceler.
      Marketing waitlist stays at repo root on GitHub Pages.
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

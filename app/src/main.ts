import "./style.css";
import type { AccessTag, Finding } from "./model/findings";
import {
  confidenceLabel,
  ecosystemLabel,
  howKnownLabel,
  kindToBucket,
  safeRevokeUrl,
} from "./model/findings";
import {
  connectGoogle,
  disconnect,
  hasClientId,
  isConnected,
} from "./auth/google";
import { emptyScanStats, type ScanStats } from "./gmail/client";
import {
  APPLE_GUIDED,
  LOCATION_GUIDED,
  markGuidedReviewed,
  type GuidedItem,
} from "./guided/checklists";
import {
  bucketCountsForChips,
  exportMapSummary,
  type MapFilter,
  visibleFindings,
} from "./map/filter";
import {
  addManualAgent,
  clearManualAgents,
  listManualAgents,
} from "./registry/agents";
import { runDemoScan } from "./scan/runDemo";
import { demoScanStats, runLiveScan } from "./scan/runLive";

type Mode = "idle" | "demo" | "live";
type SourcePanel = "demo" | "agents" | "apple" | "location" | "gmail";

let findings: Finding[] = [];
let dismissed = new Set<string>();
let showDismissed = false;
let searchQuery = "";
let filter: MapFilter = "all";
let selectedId: string | null = null;
let mode: Mode = "idle";
let sourcePanel: SourcePanel = "demo";
let lastStats: ScanStats = emptyScanStats();
let debugOpen = false;
let statusText =
  "Multi-surface permission map: Access · Agents · Location. Load the demo map — no Google required.";
let statusKind: "ok" | "error" | "info" | "" = "info";
let busy = false;
let copyFlash = "";

const TAGS: AccessTag[] = [
  "mail",
  "files",
  "calendar",
  "location",
  "browser",
  "other",
];

const app = document.querySelector<HTMLDivElement>("#app")!;

function clearDismissals() {
  dismissed = new Set();
  showDismissed = false;
}

function rebuildFromLayers() {
  findings = runDemoScan();
}

function selected(): Finding | null {
  return findings.find((f) => f.id === selectedId) || null;
}

function setStatus(text: string, kind: "ok" | "error" | "info" | "" = "") {
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

function pillarIntro(): string {
  if (filter === "agents") {
    return `<div class="pillar-intro"><strong>Agents</strong> — standing inventory of AI tools and automations. Add via Agent registry. Not a live control plane for ChatGPT/Claude servers.</div>`;
  }
  if (filter === "location") {
    return `<div class="pillar-intro"><strong>Location</strong> — Always / While Using, geofence, significant locations. Guided OS links only — Umbra does not read device TCC from the web.</div>`;
  }
  if (filter === "access") {
    return `<div class="pillar-intro"><strong>Access</strong> — OAuth, Sign in with Apple/Google/Microsoft, connected apps across ecosystems. Gmail archaeology is optional, not the product.</div>`;
  }
  if (filter === "alerts") {
    return `<div class="pillar-intro"><strong>Alerts</strong> — security / sign-in class signals when present.</div>`;
  }
  return `<div class="pillar-intro"><strong>All surfaces</strong> — Access · Agents · Location. Demo fixtures are multi-ecosystem (Apple, Google, Microsoft, AI, device).</div>`;
}

async function onDemo() {
  setBusy(true);
  try {
    clearDismissals();
    // Keep manual agents + guided reviews across demo reload
    findings = runDemoScan();
    mode = "demo";
    lastStats = demoScanStats(findings.length);
    selectedId = visible()[0]?.id ?? findings[0]?.id ?? null;
    const c = chipCounts();
    setStatus(
      `Demo map loaded: ${findings.length} findings (${listManualAgents().length} manual agents kept). access ${c.access} · agents ${c.agents} · location ${c.location}. Not your live inbox.`,
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
      "Gmail archaeology is optional and parked. Use Demo map + Agent registry + guided checklists. OAuth: Umbra GCP only — see README.",
      "info",
    );
    sourcePanel = "gmail";
    render();
    return;
  }
  setBusy(true);
  try {
    const auth = await connectGoogle();
    setStatus(
      `Connected${auth.email ? ` as ${auth.email}` : ""}. Optional method only. Token memory-only.`,
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
    setStatus("Connect Google first, or stay on Demo map.", "error");
    return;
  }
  setBusy(true);
  try {
    clearDismissals();
    const result = await runLiveScan();
    // Merge live with manuals (manual howKnown preserved)
    const manuals = listManualAgents();
    const byId = new Map<string, Finding>();
    for (const f of result.findings) byId.set(f.id, f);
    for (const f of manuals) byId.set(f.id, f);
    findings = [...byId.values()];
    lastStats = result.stats;
    mode = "live";
    selectedId = visible()[0]?.id ?? null;
    setStatus(
      `Live Gmail layer: ${result.findings.length} archaeology hits + ${manuals.length} manual agents. Bodies only when prefilter passed.`,
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
    findings = runDemoScan();
    mode = findings.length ? "demo" : "idle";
    lastStats = emptyScanStats();
  }
  setStatus("Disconnected. Token cleared. Map back to demo/manual layers if any.", "ok");
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
    copyFlash = `Copied ${rows.length} visible findings (ecosystem included, no bodies).`;
  } catch {
    copyFlash = "Clipboard blocked — see console.";
    console.log(text);
  }
  render();
  window.setTimeout(() => {
    copyFlash = "";
    render();
  }, 2500);
}

function onAddAgent() {
  const name = (document.getElementById("agent-name") as HTMLInputElement)?.value || "";
  const url = (document.getElementById("agent-url") as HTMLInputElement)?.value || "";
  const notes = (document.getElementById("agent-notes") as HTMLTextAreaElement)?.value || "";
  const tags: AccessTag[] = [];
  for (const t of TAGS) {
    const el = document.getElementById(`tag-${t}`) as HTMLInputElement | null;
    if (el?.checked) tags.push(t);
  }
  try {
    const f = addManualAgent({ name, accessTags: tags, manageUrl: url, notes });
    rebuildFromLayers();
    selectedId = f.id;
    filter = "agents";
    mode = mode === "idle" ? "demo" : mode;
    setStatus(`Added agent “${f.party}” to registry (session memory — refresh clears).`, "ok");
  } catch (e) {
    setStatus(e instanceof Error ? e.message : String(e), "error");
  }
}

function onClearRegistry() {
  clearManualAgents();
  rebuildFromLayers();
  setStatus("Agent registry cleared (session).", "ok");
}

function onMarkGuided(item: GuidedItem) {
  markGuidedReviewed(item);
  rebuildFromLayers();
  selectedId = `guided-${item.id}`;
  setStatus(`Marked reviewed: ${item.title} (guided finding, low confidence).`, "ok");
}

function renderDetail(f: Finding | null): string {
  if (!f) {
    return `<div class="empty">
      <p><strong>Select a finding</strong> or load the demo map.</p>
      <p class="muted-line">Pillars: Access · Agents · Location. Register AI tools under Sources → Agent registry.</p>
    </div>`;
  }
  const isGone = dismissed.has(f.id);
  const safe = safeRevokeUrl(f.revokeUrl);
  const revoke = safe
    ? `<p><a class="btn external" href="${escapeAttr(safe)}" target="_blank" rel="noopener noreferrer">Open external manage / revoke</a></p>
       <p class="setup">External only. Umbra never revokes for you.</p>`
    : `<p class="setup">No allowlisted manage URL. Use vendor/OS settings manually.</p>`;
  const tags =
    f.accessTags && f.accessTags.length
      ? `<div><dt>Access tags</dt><dd>${f.accessTags.map((t) => escapeHtml(t)).join(", ")}</dd></div>`
      : "";
  const dismissBtn = isGone
    ? `<button type="button" class="ghost" id="btn-restore" data-id="${escapeAttr(f.id)}">Restore</button>`
    : `<button type="button" class="ghost" id="btn-dismiss" data-id="${escapeAttr(f.id)}">Not relevant / dismiss</button>`;

  return `
    <div class="detail">
      <h3>${escapeHtml(f.title)}</h3>
      <p class="badges">
        <span class="mode-chip">${escapeHtml(ecosystemLabel(f.ecosystem))}</span>
        <span class="mode-chip">${escapeHtml(howKnownLabel(f.howKnown))}</span>
        ${isGone ? `<span class="mode-chip">dismissed</span>` : ""}
      </p>
      <dl>
        <div><dt>Party</dt><dd>${escapeHtml(f.party)}</dd></div>
        <div><dt>Kind</dt><dd><span class="kind">${escapeHtml(f.kind)}</span> · <code>${escapeHtml(kindToBucket(f.kind))}</code></dd></div>
        <div><dt>Confidence</dt><dd>${escapeHtml(f.confidence)} — ${escapeHtml(confidenceLabel(f.confidence))}</dd></div>
        <div><dt>When</dt><dd>${f.evidenceDate ? escapeHtml(f.evidenceDate) : "Unknown"}</dd></div>
        <div><dt>Summary</dt><dd>${escapeHtml(f.summary)}</dd></div>
        ${tags}
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
      <p>Click <strong>Load demo map</strong> for multi-surface fixtures (Apple, Google, Microsoft, AI, location).</p>
    </div>`;
  }
  if (!items.length) {
    return `<div class="empty"><p>No rows match filter/search.</p></div>`;
  }
  return `<ul class="list">${items
    .map((f) => {
      const sel = f.id === selectedId ? " selected" : "";
      const dim = dismissed.has(f.id) ? " dismissed-row" : "";
      return `<li>
        <button type="button" class="row${sel}${dim}" data-id="${escapeAttr(f.id)}">
          <span class="kind">${escapeHtml(f.kind)}</span>
          <span class="eco">${escapeHtml(f.ecosystem)}</span>
          <span class="row-title">${escapeHtml(f.title)}</span>
          <span class="row-meta">${escapeHtml(f.party)} · ${escapeHtml(f.howKnown)} · conf ${escapeHtml(f.confidence)}</span>
        </button>
      </li>`;
    })
    .join("")}</ul>`;
}

function filterBtn(id: MapFilter, label: string, n: number): string {
  return `<button type="button" data-filter="${id}" class="${filter === id ? "active" : ""}">${label} <span class="chip-n">${n}</span></button>`;
}

function sourceTab(id: SourcePanel, label: string, note?: string): string {
  return `<button type="button" class="src-tab ${sourcePanel === id ? "active" : ""}" data-src="${id}">${label}${note ? ` <small>${note}</small>` : ""}</button>`;
}

function renderSourcesBody(): string {
  if (sourcePanel === "agents") {
    const regs = listManualAgents();
    return `
      <div class="src-body">
        <p class="setup"><strong>Agent registry</strong> (session memory — refresh loses entries). Standing inventory + manage links, not live control of ChatGPT/Claude.</p>
        <div class="agent-form">
          <label>Name <input id="agent-name" placeholder="e.g. Work ChatGPT" /></label>
          <fieldset class="tags">
            <legend>Access tags</legend>
            ${TAGS.map((t) => `<label class="check"><input type="checkbox" id="tag-${t}" /> ${t}</label>`).join("")}
          </fieldset>
          <label>Manage URL (https, optional) <input id="agent-url" placeholder="https://…" /></label>
          <label>Notes <textarea id="agent-notes" rows="2" placeholder="What it can do…"></textarea></label>
          <div class="actions-row">
            <button type="button" class="primary" id="btn-add-agent">Add to map</button>
            <button type="button" class="ghost" id="btn-clear-agents" ${regs.length ? "" : "disabled"}>Clear registry</button>
          </div>
        </div>
        <p class="muted-line">${regs.length} registered this session.</p>
      </div>`;
  }
  if (sourcePanel === "apple") {
    return `
      <div class="src-body">
        <p class="setup"><strong>Guided: Apple &amp; device permissions.</strong> Umbra cannot read TCC or SIWA lists from the web. Open Apple settings, then mark reviewed.</p>
        <ul class="guided-list">
          ${APPLE_GUIDED.map(
            (g) => `<li>
              <strong>${escapeHtml(g.title)}</strong>
              <p>${escapeHtml(g.body)}</p>
              <a href="${escapeAttr(g.href)}" target="_blank" rel="noopener noreferrer">Open guide</a>
              <button type="button" class="ghost btn-mark" data-guided="${escapeAttr(g.id)}">Mark reviewed</button>
            </li>`,
          ).join("")}
        </ul>
      </div>`;
  }
  if (sourcePanel === "location") {
    return `
      <div class="src-body">
        <p class="setup"><strong>Guided: Location.</strong> Always vs While Using, geofences, system services — on device. Beacon/zones = future direction only.</p>
        <ul class="guided-list">
          ${LOCATION_GUIDED.map(
            (g) => `<li>
              <strong>${escapeHtml(g.title)}</strong>
              <p>${escapeHtml(g.body)}</p>
              <a href="${escapeAttr(g.href)}" target="_blank" rel="noopener noreferrer">Open guide</a>
              <button type="button" class="ghost btn-mark" data-guided="${escapeAttr(g.id)}">Mark reviewed</button>
            </li>`,
          ).join("")}
        </ul>
      </div>`;
  }
  if (sourcePanel === "gmail") {
    const clientConfigured = hasClientId();
    const connected = isConnected();
    return `
      <div class="src-body">
        <p class="setup"><strong>Gmail archaeology — optional / parked.</strong> Method for Google-stack OAuth mail signals, not the product name. Prefer demo + agents + guided surfaces.</p>
        <div class="actions-row">
          <button type="button" id="btn-connect" ${busy ? "disabled" : ""}>${connected ? "Re-auth Google" : "Connect Google"}</button>
          <button type="button" id="btn-live" ${busy || !connected ? "disabled" : ""}>Live Gmail scan</button>
          <button type="button" class="ghost" id="btn-disconnect" ${busy || !connected ? "disabled" : ""}>Disconnect</button>
        </div>
        <p class="muted-line">${clientConfigured ? "Client id present." : "No VITE_GOOGLE_CLIENT_ID — live path disabled."}</p>
      </div>`;
  }
  return `
    <div class="src-body">
      <p class="setup"><strong>Demo data</strong> — multi-surface fixtures (Apple SIWA, Microsoft consent, AI agents, location Always, etc.). Not your live accounts.</p>
      <button type="button" class="primary" id="btn-demo-inner" ${busy ? "disabled" : ""}>Load demo map</button>
    </div>`;
}

function modeBanner(): string {
  if (mode === "demo") {
    return `<div class="banner demo"><strong>Demo map</strong> — multi-ecosystem fixtures + any agents you registered this session.</div>`;
  }
  if (mode === "live") {
    return `<div class="banner live"><strong>Live layer</strong> — Gmail archaeology + manuals. Disconnect clears token.</div>`;
  }
  return `<div class="banner idle">Permission map across <strong>Access · Agents · Location</strong> — not a Gmail-only scanner.</div>`;
}

function debugStrip(): string {
  const s = lastStats;
  return `
    <details class="debug" ${debugOpen ? "open" : ""}>
      <summary>Debug · Gmail calibration (optional path)</summary>
      <ul>
        <li>candidates: ${s.candidatesListed}</li>
        <li>metadata: ${s.metadataFetched}</li>
        <li>prefilter pass: ${s.prefilterPassed}</li>
        <li>bodies: ${s.bodiesFetched}</li>
        <li>parsed: ${s.parsed}</li>
        <li>unmatched: ${s.unmatched}</li>
      </ul>
    </details>`;
}

function allGuided(): GuidedItem[] {
  return [...APPLE_GUIDED, ...LOCATION_GUIDED];
}

function render() {
  const items = visible();
  const counts = chipCounts();

  app.innerHTML = `
    <header class="topbar">
      <div>
        <div class="brand">Umbra <span class="badge">codename · multi-surface</span></div>
        <p class="hero-line">One map of standing permissions: apps &amp; OAuth, AI agents, location — across Apple, Google, Microsoft, and more.</p>
        <p class="honesty">Read-only · on this device · revoke external · dismiss/session registry memory-only · not a mail honeypot</p>
      </div>
      <div class="actions">
        <button type="button" class="primary" id="btn-demo" ${busy ? "disabled" : ""}>Load demo map</button>
        <button type="button" class="ghost" id="btn-copy" ${busy || !findings.length ? "disabled" : ""}>Copy map summary</button>
      </div>
    </header>

    ${modeBanner()}
    <div class="status ${statusKind}">${escapeHtml(statusText)}</div>
    ${copyFlash ? `<p class="flash">${escapeHtml(copyFlash)}</p>` : ""}

    <section class="sources panel">
      <h2>Sources</h2>
      <div class="src-tabs">
        ${sourceTab("demo", "Demo data")}
        ${sourceTab("agents", "Agent registry")}
        ${sourceTab("apple", "Guided: Apple & device")}
        ${sourceTab("location", "Guided: Location")}
        ${sourceTab("gmail", "Gmail archaeology", "optional")}
      </div>
      ${renderSourcesBody()}
    </section>

    ${debugStrip()}

    <div class="layout">
      <section class="panel">
        <h2>Permission map <span class="count">${items.length} shown · ${findings.length} total</span></h2>
        ${pillarIntro()}
        <div class="toolbar">
          <label class="search-label">
            <span class="sr-only">Search</span>
            <input type="search" id="search" placeholder="Search party, title, ecosystem…" value="${escapeAttr(searchQuery)}" autocomplete="off" />
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
      Gmail is one optional archaeology method. Product = multi-surface standing permissions.
      Manual agents clear only via Clear registry (or page refresh). Guided reviews stay until refresh.
    </p>
  `;

  document.getElementById("btn-demo")?.addEventListener("click", () => void onDemo());
  document.getElementById("btn-demo-inner")?.addEventListener("click", () => void onDemo());
  document.getElementById("btn-copy")?.addEventListener("click", () => void onCopySummary());
  document.getElementById("btn-connect")?.addEventListener("click", () => void onConnect());
  document.getElementById("btn-live")?.addEventListener("click", () => void onLiveScan());
  document.getElementById("btn-disconnect")?.addEventListener("click", onDisconnect);
  document.getElementById("btn-add-agent")?.addEventListener("click", onAddAgent);
  document.getElementById("btn-clear-agents")?.addEventListener("click", onClearRegistry);

  app.querySelectorAll<HTMLButtonElement>("[data-src]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sourcePanel = btn.dataset.src as SourcePanel;
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>(".btn-mark").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.guided;
      const item = allGuided().find((g) => g.id === id);
      if (item) onMarkGuided(item);
    });
  });

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

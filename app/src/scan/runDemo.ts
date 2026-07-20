import { DEMO_FINDINGS } from "../demo/fixtures";
import type { Finding } from "../model/findings";
import { normalizeFinding } from "../model/findings";
import { listGuidedFindings } from "../guided/checklists";
import { listManualAgents } from "../registry/agents";

/**
 * Multi-surface demo map + session manuals + guided reviews.
 * Manual agents are NOT cleared (caller policy).
 */
export function runDemoScan(): Finding[] {
  const byId = new Map<string, Finding>();
  for (const f of DEMO_FINDINGS) {
    const n = normalizeFinding(f);
    byId.set(n.id, n);
  }
  // Do not merge Gmail sample parsers into default demo — keeps map multi-surface, not Gmail-heavy
  for (const f of listManualAgents()) {
    byId.set(f.id, normalizeFinding(f));
  }
  for (const f of listGuidedFindings()) {
    byId.set(f.id, normalizeFinding(f));
  }
  return [...byId.values()];
}

/** Rebuild map from current demo fixtures + manuals + guided without resetting manuals. */
export function mergeMapLayers(
  demoAndGuided: Finding[],
  manuals: Finding[],
): Finding[] {
  const byId = new Map<string, Finding>();
  for (const f of demoAndGuided) byId.set(f.id, normalizeFinding(f));
  for (const f of manuals) byId.set(f.id, normalizeFinding(f));
  return [...byId.values()];
}

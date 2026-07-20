import { DEMO_FINDINGS } from "../demo/fixtures";
import type { Finding } from "../model/findings";
import { normalizeFinding } from "../model/findings";
import { listGuidedFindings } from "../guided/checklists";
import { mergeFindings } from "../merge/findings";
import { listManualAgents } from "../registry/agents";
import { listCloudDirected } from "../registry/cloud";

/** Session layers filled by companion import / pull (not cleared by demo load). */
let importedLocal: Finding[] = [];

export function setImportedLocal(findings: Finding[]): void {
  importedLocal = findings.map(normalizeFinding);
}

export function listImportedLocal(): Finding[] {
  return [...importedLocal];
}

export function clearImportedLocal(): void {
  importedLocal = [];
}

/**
 * Multi-surface demo + manuals + guided + cloud directed + local imports.
 * Manual/cloud/local imports survive demo reload.
 */
export function runDemoScan(): Finding[] {
  return mergeFindings(
    DEMO_FINDINGS.map(normalizeFinding),
    listManualAgents(),
    listGuidedFindings(),
    listCloudDirected(),
    importedLocal,
  );
}

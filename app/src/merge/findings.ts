import type { Finding } from "../model/findings";
import { normalizeFinding } from "../model/findings";

export function dedupeKey(f: Finding): string {
  return `${f.kind}|${f.party}|${f.title}`.toLowerCase();
}

/**
 * Merge layers: later lists win on same id; same kind+party+title collapses.
 */
export function mergeFindings(...layers: Finding[][]): Finding[] {
  const byId = new Map<string, Finding>();
  const byDedupe = new Map<string, string>(); // dedupeKey -> id kept

  for (const layer of layers) {
    for (const raw of layer) {
      const f = normalizeFinding(raw);
      const prevId = byDedupe.get(dedupeKey(f));
      if (prevId && prevId !== f.id) {
        byId.delete(prevId);
      }
      byId.set(f.id, f);
      byDedupe.set(dedupeKey(f), f.id);
    }
  }
  return [...byId.values()];
}

/** Accept companion or export JSON shapes. */
export function parseImportPayload(data: unknown): Finding[] {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid JSON: expected object");
  }
  const obj = data as { findings?: unknown };
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(obj.findings)
      ? obj.findings
      : null;
  if (!arr) throw new Error("JSON must be { findings: Finding[] } or Finding[]");

  const out: Finding[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const f = item as Partial<Finding>;
    if (!f.id || !f.kind || !f.title || !f.party) continue;
    out.push(
      normalizeFinding({
        id: String(f.id),
        kind: f.kind as Finding["kind"],
        title: String(f.title),
        party: String(f.party),
        summary: String(f.summary || ""),
        evidenceDate: f.evidenceDate,
        source: f.source === "gmail" ? "gmail" : "demo",
        ecosystem: (f.ecosystem as Finding["ecosystem"]) || "other",
        howKnown: (f.howKnown as Finding["howKnown"]) || "local_scan",
        confidence: (f.confidence as Finding["confidence"]) || "medium",
        revokeUrl: f.revokeUrl,
        rawSubject: f.rawSubject,
        accessTags: f.accessTags,
      }),
    );
  }
  return out;
}

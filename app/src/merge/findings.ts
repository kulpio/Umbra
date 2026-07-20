import type {
  Confidence,
  Ecosystem,
  Finding,
  FindingKind,
  FindingSource,
  HowKnown,
} from "../model/findings";
import { normalizeFinding } from "../model/findings";

const KINDS = new Set<FindingKind>([
  "oauth_grant",
  "connected_app",
  "ai_agent",
  "location",
  "security_alert",
  "other_access",
]);

const ECOSYSTEMS = new Set<Ecosystem>([
  "google",
  "apple",
  "microsoft",
  "ai",
  "device",
  "browser",
  "other",
]);

const HOW_KNOWNS = new Set<HowKnown>([
  "demo",
  "gmail",
  "manual",
  "guided",
  "local_scan",
  "cloud_directed",
]);

const CONFIDENCES = new Set<Confidence>(["high", "medium", "low"]);

const SOURCES = new Set<FindingSource>(["gmail", "demo"]);

function asKind(v: unknown): FindingKind | null {
  return typeof v === "string" && KINDS.has(v as FindingKind)
    ? (v as FindingKind)
    : null;
}

function asEcosystem(v: unknown): Ecosystem {
  return typeof v === "string" && ECOSYSTEMS.has(v as Ecosystem)
    ? (v as Ecosystem)
    : "other";
}

function asHowKnown(v: unknown, source: FindingSource): HowKnown {
  if (typeof v === "string" && HOW_KNOWNS.has(v as HowKnown)) {
    return v as HowKnown;
  }
  return source === "gmail" ? "gmail" : "local_scan";
}

function asConfidence(v: unknown): Confidence {
  return typeof v === "string" && CONFIDENCES.has(v as Confidence)
    ? (v as Confidence)
    : "medium";
}

function asSource(v: unknown): FindingSource {
  return typeof v === "string" && SOURCES.has(v as FindingSource)
    ? (v as FindingSource)
    : "demo";
}

export function dedupeKey(f: Finding): string {
  return `${f.kind}|${f.party}|${f.title}`.toLowerCase();
}

export function mergeFindings(...layers: Finding[][]): Finding[] {
  const byId = new Map<string, Finding>();
  const byDedupe = new Map<string, string>();

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

/**
 * Accept companion or export JSON. Invalid enum rows are skipped (or fields defaulted).
 * Never throws on bad enum values inside rows — only on wholly invalid top-level shape.
 */
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
    const f = item as Record<string, unknown>;
    if (f.id == null || f.title == null || f.party == null) continue;

    const kind = asKind(f.kind);
    if (!kind) continue; // invalid kind → drop row

    const source = asSource(f.source);
    const howKnown = asHowKnown(f.howKnown, source);
    const ecosystem = asEcosystem(f.ecosystem);
    const confidence = asConfidence(f.confidence);

    const accessTags = Array.isArray(f.accessTags)
      ? f.accessTags.filter((t): t is string => typeof t === "string").slice(0, 12)
      : undefined;

    out.push(
      normalizeFinding({
        id: String(f.id).slice(0, 200),
        kind,
        title: String(f.title).slice(0, 500),
        party: String(f.party).slice(0, 200),
        summary: String(f.summary ?? "").slice(0, 2000),
        evidenceDate:
          typeof f.evidenceDate === "string"
            ? f.evidenceDate.slice(0, 40)
            : undefined,
        source,
        ecosystem,
        howKnown,
        confidence,
        revokeUrl:
          typeof f.revokeUrl === "string" ? f.revokeUrl.slice(0, 2000) : undefined,
        rawSubject:
          typeof f.rawSubject === "string"
            ? f.rawSubject.slice(0, 500)
            : undefined,
        accessTags: accessTags as Finding["accessTags"],
      }),
    );
  }
  return out;
}

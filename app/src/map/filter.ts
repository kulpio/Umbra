import type { Confidence, Finding, FindingBucket } from "../model/findings";
import { kindToBucket } from "../model/findings";

export type MapFilter = "all" | FindingBucket;

const CONF_RANK: Record<Confidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function isDismissed(
  dismissed: ReadonlySet<string>,
  id: string,
): boolean {
  return dismissed.has(id);
}

export function visibleFindings(
  findings: readonly Finding[],
  opts: {
    dismissed: ReadonlySet<string>;
    showDismissed: boolean;
    filter: MapFilter;
    search: string;
  },
): Finding[] {
  const q = opts.search.trim().toLowerCase();
  const list = findings.filter((f) => {
    if (!opts.showDismissed && opts.dismissed.has(f.id)) return false;
    if (opts.filter !== "all" && kindToBucket(f.kind) !== opts.filter) {
      return false;
    }
    if (q) {
      const hay =
        `${f.party} ${f.title} ${f.summary} ${f.kind} ${f.ecosystem} ${f.howKnown}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  return sortFindings(list);
}

export function sortFindings(findings: readonly Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const da = a.evidenceDate || "";
    const db = b.evidenceDate || "";
    if (da !== db) return db.localeCompare(da);
    const ca = CONF_RANK[a.confidence] ?? 0;
    const cb = CONF_RANK[b.confidence] ?? 0;
    if (ca !== cb) return cb - ca;
    return a.title.localeCompare(b.title);
  });
}

export function bucketCountsForChips(
  findings: readonly Finding[],
  opts: {
    dismissed: ReadonlySet<string>;
    showDismissed: boolean;
    search: string;
  },
): Record<FindingBucket | "all", number> {
  const q = opts.search.trim().toLowerCase();
  const counts: Record<FindingBucket | "all", number> = {
    all: 0,
    access: 0,
    agents: 0,
    location: 0,
    alerts: 0,
  };
  for (const f of findings) {
    if (!opts.showDismissed && opts.dismissed.has(f.id)) continue;
    if (q) {
      const hay =
        `${f.party} ${f.title} ${f.summary} ${f.kind} ${f.ecosystem}`.toLowerCase();
      if (!hay.includes(q)) continue;
    }
    counts.all++;
    counts[kindToBucket(f.kind)]++;
  }
  return counts;
}

export type ExportRow = {
  kind: string;
  party: string;
  title: string;
  confidence: string;
  ecosystem: string;
  howKnown: string;
  evidenceDate?: string;
  source: string;
};

export function exportMapSummary(
  findings: readonly Finding[],
  format: "json" | "text" = "text",
): string {
  const rows: ExportRow[] = findings.map((f) => ({
    kind: f.kind,
    party: f.party,
    title: f.title,
    confidence: f.confidence,
    ecosystem: f.ecosystem,
    howKnown: f.howKnown,
    evidenceDate: f.evidenceDate,
    source: f.source,
  }));
  if (format === "json") {
    return JSON.stringify(
      { exportedAt: new Date().toISOString(), findings: rows },
      null,
      2,
    );
  }
  const lines = [
    "Umbra multi-surface permission map (no email bodies)",
    `Exported: ${new Date().toISOString()}`,
    `Count: ${rows.length}`,
    "",
  ];
  for (const r of rows) {
    lines.push(
      `- [${r.kind}/${r.ecosystem}] ${r.party}: ${r.title} (${r.confidence}, ${r.howKnown}${r.evidenceDate ? `, ${r.evidenceDate}` : ""})`,
    );
  }
  return lines.join("\n");
}

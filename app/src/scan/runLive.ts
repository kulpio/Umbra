import { getAccessToken } from "../auth/google";
import {
  emptyScanStats,
  fetchPermissionMessages,
  type ScanStats,
} from "../gmail/client";
import type { Finding } from "../model/findings";
import { findingsFromMessages } from "../parse/fromMessage";

export type LiveScanResult = {
  findings: Finding[];
  stats: ScanStats;
};

export async function runLiveScan(): Promise<LiveScanResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not connected. Connect Google first.");
  }
  const { messages, stats } = await fetchPermissionMessages(token, 40);
  const findings = findingsFromMessages(messages, "gmail");
  stats.parsed = findings.length;
  // unmatched already counts prefilter misses; bodies without parser hit:
  stats.unmatched += Math.max(0, stats.bodiesFetched - findings.length);
  return { findings, stats };
}

export function demoScanStats(findingCount: number): ScanStats {
  const s = emptyScanStats();
  s.parsed = findingCount;
  return s;
}

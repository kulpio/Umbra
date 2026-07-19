import { DEMO_FINDINGS } from "../demo/fixtures";
import { SAMPLE_MESSAGES } from "../demo/fixtures";
import type { Finding } from "../model/findings";
import { findingsFromMessages } from "../parse/fromMessage";

/**
 * Demo scan: rich fixtures + parser output from sample messages (merged, demos first).
 */
export function runDemoScan(): Finding[] {
  const parsed = findingsFromMessages(SAMPLE_MESSAGES, "demo");
  const byKey = new Map<string, Finding>();
  for (const f of DEMO_FINDINGS) {
    byKey.set(`${f.kind}:${f.party}:${f.title}`, f);
  }
  for (const f of parsed) {
    const key = `${f.kind}:${f.party}:${f.title}`;
    if (!byKey.has(key)) byKey.set(key, f);
  }
  return [...byKey.values()];
}

import type { Finding, FindingSource } from "../model/findings";
import { defaultRevokeUrl } from "../model/findings";
import type { SampleMessage } from "../demo/fixtures";
import { RULES } from "./patterns";

function extractParty(
  text: string,
  partyFrom: RegExp | undefined,
  fallback: string,
): string {
  if (!partyFrom) return fallback;
  const m = text.match(partyFrom);
  if (m && m[1]) return m[1].trim();
  return fallback;
}

/** Parse a single Gmail-like message into zero or one finding. */
export function findingFromMessage(
  msg: SampleMessage,
  source: FindingSource = "gmail",
): Finding | null {
  const hay = `${msg.subject}\n${msg.snippet}\n${msg.body}`;
  for (const rule of RULES) {
    if (!rule.test.test(hay)) continue;
    const party = extractParty(hay, rule.partyFrom, rule.defaultParty);
    return {
      id: `${source}-${msg.id}-${rule.id}`,
      kind: rule.kind,
      title: rule.title(party),
      party,
      summary: rule.summary(party),
      evidenceDate: msg.date,
      source,
      confidence: rule.confidence,
      revokeUrl: defaultRevokeUrl(rule.kind),
      rawSubject: msg.subject,
    };
  }
  return null;
}

export function findingsFromMessages(
  messages: SampleMessage[],
  source: FindingSource = "gmail",
): Finding[] {
  const out: Finding[] = [];
  for (const msg of messages) {
    const f = findingFromMessage(msg, source);
    if (f) out.push(f);
  }
  return out;
}

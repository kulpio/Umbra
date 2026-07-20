import type {
  Ecosystem,
  Finding,
  FindingSource,
  HowKnown,
} from "../model/findings";
import { defaultRevokeUrl, safeRevokeUrl } from "../model/findings";
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

function ecosystemFromText(text: string, kind: string): Ecosystem {
  if (/apple|icloud|sign in with apple/i.test(text)) return "apple";
  if (/microsoft|outlook|copilot|azure|live\.com/i.test(text)) return "microsoft";
  if (/openai|chatgpt|claude|anthropic|cursor|perplexity|ai agent|ai assistant/i.test(text))
    return "ai";
  if (/uber|lyft|browser extension/i.test(text)) return "other";
  if (kind === "ai_agent") return "ai";
  if (kind === "location" && /maps|google/i.test(text)) return "google";
  return "google";
}

function howKnownFromSource(source: FindingSource): HowKnown {
  return source === "gmail" ? "gmail" : "demo";
}

export function findingFromMessage(
  msg: SampleMessage,
  source: FindingSource = "gmail",
): Finding | null {
  const hay = `${msg.subject}\n${msg.snippet}\n${msg.body}`;
  for (const rule of RULES) {
    if (!rule.test.test(hay)) continue;
    const party = extractParty(hay, rule.partyFrom, rule.defaultParty);
    const ecosystem = ecosystemFromText(hay, rule.kind);
    const howKnown = howKnownFromSource(source);
    const revoke = safeRevokeUrl(defaultRevokeUrl(rule.kind, ecosystem));
    return {
      id: `${source}-${msg.id}-${rule.id}`,
      kind: rule.kind,
      title: rule.title(party),
      party,
      summary: rule.summary(party),
      evidenceDate: msg.date,
      source,
      howKnown,
      ecosystem,
      confidence: rule.confidence,
      revokeUrl: revoke,
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

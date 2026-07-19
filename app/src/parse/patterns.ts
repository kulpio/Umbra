import type { FindingKind } from "../model/findings";

export type PatternRule = {
  id: string;
  kind: FindingKind;
  /** Case-insensitive match on subject + snippet + body */
  test: RegExp;
  partyFrom?: RegExp;
  defaultParty: string;
  confidence: "high" | "medium" | "low";
  title: (party: string) => string;
  summary: (party: string) => string;
};

/**
 * Ordered rules: first match wins for a message.
 * Focused on permission / agent / location / security signals — not billing.
 */
export const RULES: PatternRule[] = [
  // More specific access grants before generic "Security alert" subjects
  {
    id: "oauth-granted",
    kind: "oauth_grant",
    test: /was granted access|granted access to your google|oauth application authorized|third-party (app|application) was authorized/i,
    partyFrom:
      /(?:Security alert:\s*)?([A-Za-z0-9][A-Za-z0-9 ._-]{1,40}?)\s+was granted/i,
    defaultParty: "Third-party app",
    confidence: "high",
    title: (p) => `${p} granted account access`,
    summary: (p) =>
      `OAuth-style grant involving ${p}. Confirm you still want this access.`,
  },
  {
    id: "ai-openai",
    kind: "ai_agent",
    test: /openai|chatgpt|claude\.ai|anthropic|copilot|gemini app|ai assistant/i,
    partyFrom: /(OpenAI|ChatGPT|Claude|Anthropic|Copilot|Gemini)/i,
    defaultParty: "AI product",
    confidence: "high",
    title: (p) => `${p}: AI / agent-style access`,
    summary: (p) =>
      `${p} appears in a connection or access notice. Audit scopes and revoke unused AI connectors.`,
  },
  {
    id: "connected",
    kind: "connected_app",
    test: /is connected to your|app connected to your|sign in with google|signed in with google|signed in to \w+ using sign in with google/i,
    partyFrom: /([A-Za-z0-9][A-Za-z0-9 ._-]{1,40}?)\s+is connected/i,
    defaultParty: "Connected app",
    confidence: "medium",
    title: (p) => `${p} connected to your account`,
    summary: (p) =>
      `${p} connection notice. Review connected apps and revoke if unused.`,
  },
  {
    id: "loc",
    kind: "location",
    test: /location sharing|real-time location|device location|geofenc|maps timeline|who can see your location/i,
    partyFrom: /(Google Maps|Uber|Lyft|Maps)/i,
    defaultParty: "Location service",
    confidence: "medium",
    title: (p) => `${p}: location or sharing signal`,
    summary: (p) =>
      `${p} mentioned location access or sharing. Review who can still see where you are.`,
  },
  {
    id: "sec-signin",
    kind: "security_alert",
    // Avoid matching "Security alert: App was granted access" (handled above)
    test: /new sign[- ]?in|signed in on|unusual activity|security alert(?![^\n]{0,80}granted access)/i,
    defaultParty: "Google Account",
    confidence: "high",
    title: () => "Security alert: sign-in or unusual activity",
    summary: () =>
      "Account security notice. Confirm the session; review devices if it was not you.",
  },
  {
    id: "third-party",
    kind: "other_access",
    test: /third-party access|manage connected apps|remove access anytime/i,
    defaultParty: "Third-party",
    confidence: "low",
    title: () => "Third-party access mention",
    summary: () =>
      "Mail mentions third-party access. Worth a permissions review.",
  },
];

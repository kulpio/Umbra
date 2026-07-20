import type { Finding } from "../model/findings";
import {
  ANTHROPIC_ACCOUNT,
  GITHUB_COPILOT,
  GOOGLE_AI_STUDIO,
  OPENAI_ACCOUNT,
  OPENAI_PLATFORM,
  MICROSOFT_PERMISSIONS,
  safeRevokeUrl,
} from "../model/findings";

export type CloudSurface = {
  id: string;
  party: string;
  title: string;
  body: string;
  href: string;
};

export const CLOUD_SURFACES: CloudSurface[] = [
  {
    id: "openai-chat",
    party: "ChatGPT / OpenAI",
    title: "OpenAI ChatGPT account",
    body: "Web ChatGPT settings / data controls.",
    href: OPENAI_ACCOUNT,
  },
  {
    id: "openai-platform",
    party: "OpenAI Platform",
    title: "OpenAI API platform",
    body: "API keys and org settings — you manage credentials; Umbra does not call the API in v0.",
    href: OPENAI_PLATFORM,
  },
  {
    id: "anthropic",
    party: "Claude / Anthropic",
    title: "Claude settings",
    body: "Anthropic product account surface.",
    href: ANTHROPIC_ACCOUNT,
  },
  {
    id: "github-copilot",
    party: "GitHub Copilot",
    title: "GitHub Copilot settings",
    body: "Copilot plan and policy on GitHub.",
    href: GITHUB_COPILOT,
  },
  {
    id: "google-ai",
    party: "Google AI Studio",
    title: "Google AI Studio",
    body: "Google AI / Gemini developer surface.",
    href: GOOGLE_AI_STUDIO,
  },
  {
    id: "ms-copilot",
    party: "Microsoft Copilot",
    title: "Microsoft account consents",
    body: "Microsoft account app permissions (Copilot-adjacent).",
    href: MICROSOFT_PERMISSIONS,
  },
];

let cloudFindings: Finding[] = [];

export function listCloudDirected(): Finding[] {
  return [...cloudFindings];
}

export function clearCloudDirected(): void {
  cloudFindings = [];
}

export function markCloudInUse(surface: CloudSurface, notes?: string): Finding {
  const id = `cloud-${surface.id}`;
  const existing = cloudFindings.find((x) => x.id === id);
  if (existing) return existing;
  const f: Finding = {
    id,
    kind: "ai_agent",
    title: `${surface.title} (directed)`,
    party: surface.party,
    summary:
      notes?.trim() ||
      `${surface.body} You marked this cloud surface as in use. Umbra only tracks what you point at — no drive-by cloud access.`,
    evidenceDate: new Date().toISOString().slice(0, 10),
    source: "demo",
    howKnown: "cloud_directed",
    ecosystem: "ai",
    confidence: "high",
    revokeUrl: safeRevokeUrl(surface.href),
    accessTags: ["other"],
  };
  cloudFindings = [f, ...cloudFindings];
  return f;
}

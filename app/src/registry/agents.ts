import type { AccessTag, Finding } from "../model/findings";
import { safeRevokeUrl } from "../model/findings";

export type AgentDraft = {
  name: string;
  accessTags: AccessTag[];
  manageUrl?: string;
  notes?: string;
};

/** Session-memory agent findings (manual). Survives demo reload; lost on full page refresh. */
let manualAgents: Finding[] = [];

export function listManualAgents(): Finding[] {
  return [...manualAgents];
}

export function clearManualAgents(): void {
  manualAgents = [];
}

export function addManualAgent(draft: AgentDraft): Finding {
  const name = draft.name.trim();
  if (!name) throw new Error("Agent name required");
  const id = `manual-agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tags = draft.accessTags.length ? draft.accessTags : (["other"] as AccessTag[]);
  const manage = safeRevokeUrl(draft.manageUrl);
  const f: Finding = {
    id,
    kind: "ai_agent",
    title: `${name} (registered agent)`,
    party: name,
    summary:
      draft.notes?.trim() ||
      `Manual agent registry entry. Access tags: ${tags.join(", ")}. Not auto-scanned.`,
    evidenceDate: new Date().toISOString().slice(0, 10),
    source: "demo",
    howKnown: "manual",
    ecosystem: "ai",
    confidence: "high",
    revokeUrl: manage,
    accessTags: tags,
  };
  manualAgents = [f, ...manualAgents];
  return f;
}

export function removeManualAgent(id: string): void {
  manualAgents = manualAgents.filter((a) => a.id !== id);
}

/**
 * Known AI / agent app and path patterns (open, user-readable).
 * Matching is by name only — never open config files for secrets.
 */

export type AppPattern = {
  id: string;
  party: string;
  /** Case-insensitive substring match on app/folder/process names */
  match: RegExp;
  kind: "ai_agent" | "connected_app";
  confidence: "high" | "medium" | "low";
  summary: string;
};

export const APP_PATTERNS: AppPattern[] = [
  {
    id: "cursor",
    party: "Cursor",
    match: /cursor/i,
    kind: "ai_agent",
    confidence: "high",
    summary: "Cursor IDE / agent tooling detected on this Mac (name match only).",
  },
  {
    id: "claude",
    party: "Claude",
    match: /claude/i,
    kind: "ai_agent",
    confidence: "high",
    summary: "Claude-related app or folder detected (name match only).",
  },
  {
    id: "chatgpt",
    party: "ChatGPT",
    match: /chatgpt|openai/i,
    kind: "ai_agent",
    confidence: "high",
    summary: "ChatGPT / OpenAI desktop-class name detected.",
  },
  {
    id: "windsurf",
    party: "Windsurf",
    match: /windsurf/i,
    kind: "ai_agent",
    confidence: "high",
    summary: "Windsurf / Codeium-class agent IDE name detected.",
  },
  {
    id: "perplexity",
    party: "Perplexity",
    match: /perplexity/i,
    kind: "ai_agent",
    confidence: "medium",
    summary: "Perplexity app name detected.",
  },
  {
    id: "copilot",
    party: "Copilot",
    match: /copilot/i,
    kind: "ai_agent",
    confidence: "medium",
    summary: "Copilot-related binary or app name detected.",
  },
  {
    id: "ollama",
    party: "Ollama",
    match: /ollama/i,
    kind: "ai_agent",
    confidence: "high",
    summary: "Ollama local model runtime name detected.",
  },
  {
    id: "lmstudio",
    party: "LM Studio",
    match: /lm.?studio|lmstudio/i,
    kind: "ai_agent",
    confidence: "high",
    summary: "LM Studio local model UI name detected.",
  },
  {
    id: "continue",
    party: "Continue",
    match: /continue\.dev|continue-dev|^continue$/i,
    kind: "ai_agent",
    confidence: "medium",
    summary: "Continue.dev-class agent tooling name detected.",
  },
  {
    id: "aider",
    party: "Aider",
    match: /\baider\b/i,
    kind: "ai_agent",
    confidence: "medium",
    summary: "Aider coding agent name detected.",
  },
];

/** Home-dir folders: report existence + mtime only — never read contents. */
export const HOME_DIR_HINTS: { id: string; party: string; rel: string }[] = [
  { id: "dir-cursor", party: "Cursor", rel: ".cursor" },
  { id: "dir-claude", party: "Claude", rel: ".claude" },
  { id: "dir-openai", party: "OpenAI", rel: ".openai" },
  { id: "dir-continue", party: "Continue", rel: ".continue" },
  { id: "dir-aider", party: "Aider", rel: ".aider" },
  { id: "dir-ollama", party: "Ollama", rel: ".ollama" },
  { id: "dir-config-cursor", party: "Cursor", rel: ".config/Cursor" },
  { id: "dir-config-gh-copilot", party: "Copilot", rel: ".config/github-copilot" },
];

export const LAUNCH_AGENT_MATCH =
  /cursor|claude|chatgpt|openai|ollama|copilot|windsurf|perplexity|aider|continue/i;

export function matchAppName(name: string): AppPattern | undefined {
  const base = name.replace(/\.app$/i, "");
  return APP_PATTERNS.find((p) => p.match.test(base));
}

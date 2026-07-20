export type FindingKind =
  | "oauth_grant"
  | "connected_app"
  | "ai_agent"
  | "location"
  | "security_alert"
  | "other_access";

export type FindingBucket = "access" | "agents" | "location" | "alerts";

export type Confidence = "high" | "medium" | "low";

/** Legacy scan source — prefer howKnown for new UI. */
export type FindingSource = "gmail" | "demo";

export type Ecosystem =
  | "google"
  | "apple"
  | "microsoft"
  | "ai"
  | "device"
  | "browser"
  | "other";

export type HowKnown =
  | "demo"
  | "gmail"
  | "manual"
  | "guided"
  | "local_scan"
  | "cloud_directed";

export type AccessTag =
  | "mail"
  | "files"
  | "calendar"
  | "location"
  | "browser"
  | "other";

export type Finding = {
  id: string;
  kind: FindingKind;
  title: string;
  party: string;
  summary: string;
  evidenceDate?: string;
  source: FindingSource;
  ecosystem: Ecosystem;
  howKnown: HowKnown;
  confidence: Confidence;
  revokeUrl?: string;
  rawSubject?: string;
  /** Agent registry access tags */
  accessTags?: AccessTag[];
};

export function kindToBucket(kind: FindingKind): FindingBucket {
  switch (kind) {
    case "ai_agent":
      return "agents";
    case "location":
      return "location";
    case "security_alert":
      return "alerts";
    default:
      return "access";
  }
}

export const GOOGLE_PERMISSIONS_URL =
  "https://myaccount.google.com/permissions";
export const GOOGLE_SECURITY_URL =
  "https://myaccount.google.com/security-checkup";
export const GOOGLE_ACTIVITY_URL =
  "https://myaccount.google.com/activitycontrols";
export const APPLE_ID_URL = "https://appleid.apple.com/account/manage";
export const APPLE_SIWA_SUPPORT =
  "https://support.apple.com/en-us/HT210426";
export const APPLE_LOCATION_SUPPORT =
  "https://support.apple.com/en-us/HT207092";
export const APPLE_PRIVACY_SECURITY =
  "https://support.apple.com/guide/mac-help/change-privacy-security-settings-mchlp1066/mac";
export const MICROSOFT_PERMISSIONS =
  "https://account.live.com/consent/Manage";
export const OPENAI_ACCOUNT = "https://chatgpt.com/#settings";
export const ANTHROPIC_ACCOUNT = "https://claude.ai/settings";

export function defaultRevokeUrl(kind: FindingKind, ecosystem?: Ecosystem): string {
  if (kind === "security_alert") {
    if (ecosystem === "apple") return APPLE_ID_URL;
    if (ecosystem === "microsoft") return MICROSOFT_PERMISSIONS;
    return GOOGLE_SECURITY_URL;
  }
  if (kind === "location") {
    if (ecosystem === "apple") return APPLE_LOCATION_SUPPORT;
    return GOOGLE_ACTIVITY_URL;
  }
  if (ecosystem === "apple") return APPLE_ID_URL;
  if (ecosystem === "microsoft") return MICROSOFT_PERMISSIONS;
  if (ecosystem === "ai") return OPENAI_ACCOUNT;
  return GOOGLE_PERMISSIONS_URL;
}

const ALLOWED_REVOKE_HOSTS = new Set([
  "myaccount.google.com",
  "accounts.google.com",
  "support.google.com",
  "myactivity.google.com",
  "account.live.com",
  "account.microsoft.com",
  "login.microsoftonline.com",
  "github.com",
  "appleid.apple.com",
  "support.apple.com",
  "account.apple.com",
  "www.icloud.com",
  "icloud.com",
  "privacy.apple.com",
  "chatgpt.com",
  "chat.openai.com",
  "platform.openai.com",
  "claude.ai",
  "console.anthropic.com",
  "cursor.com",
  "www.cursor.com",
  "perplexity.ai",
  "www.perplexity.ai",
  "gemini.google.com",
  "aistudio.google.com",
  "copilot.microsoft.com",
]);

/**
 * Only allow https URLs to known account-management hosts.
 */
export function safeRevokeUrl(url: string | undefined): string | undefined {
  if (!url || !url.trim()) return undefined;
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:") return undefined;
    if (ALLOWED_REVOKE_HOSTS.has(u.hostname)) return u.toString();
    if (
      u.hostname.endsWith(".google.com") ||
      u.hostname === "google.com" ||
      u.hostname.endsWith(".apple.com") ||
      u.hostname.endsWith(".microsoft.com") ||
      u.hostname.endsWith(".openai.com")
    ) {
      return u.toString();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function confidenceLabel(c: Confidence): string {
  switch (c) {
    case "high":
      return "High — strong match to a known permission pattern";
    case "medium":
      return "Medium — likely access signal; review the evidence";
    case "low":
      return "Low — weak signal or guided note; may be noisy";
  }
}

export function ecosystemLabel(e: Ecosystem): string {
  switch (e) {
    case "google":
      return "Google";
    case "apple":
      return "Apple";
    case "microsoft":
      return "Microsoft";
    case "ai":
      return "AI product";
    case "device":
      return "Device / OS";
    case "browser":
      return "Browser";
    default:
      return "Other";
  }
}

export function howKnownLabel(h: HowKnown): string {
  switch (h) {
    case "demo":
      return "Demo fixture";
    case "gmail":
      return "Gmail archaeology (optional)";
    case "manual":
      return "Agent registry (you added)";
    case "guided":
      return "Guided review (you marked)";
    case "local_scan":
      return "This Mac (companion scan)";
    case "cloud_directed":
      return "Directed cloud (you pointed)";
  }
}

export const OPENAI_PLATFORM = "https://platform.openai.com/settings";
export const GITHUB_COPILOT = "https://github.com/settings/copilot";
export const GOOGLE_AI_STUDIO = "https://aistudio.google.com/";

/** Prefer howKnown; fall back from legacy source. */
export function sourceLabel(f: Pick<Finding, "source" | "howKnown">): string {
  return howKnownLabel(f.howKnown ?? (f.source === "gmail" ? "gmail" : "demo"));
}

export function normalizeFinding(f: Finding): Finding {
  return {
    ...f,
    howKnown: f.howKnown ?? (f.source === "gmail" ? "gmail" : "demo"),
    ecosystem: f.ecosystem ?? "other",
  };
}

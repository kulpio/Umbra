export type FindingKind =
  | "oauth_grant"
  | "connected_app"
  | "ai_agent"
  | "location"
  | "security_alert"
  | "other_access";

export type FindingBucket = "access" | "agents" | "location" | "alerts";

export type Confidence = "high" | "medium" | "low";

export type FindingSource = "gmail" | "demo";

export type Finding = {
  id: string;
  kind: FindingKind;
  title: string;
  party: string;
  summary: string;
  evidenceDate?: string;
  source: FindingSource;
  confidence: Confidence;
  revokeUrl?: string;
  rawSubject?: string;
};

/** Map kind → filter bucket in UI */
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

export function defaultRevokeUrl(kind: FindingKind): string {
  if (kind === "security_alert") return GOOGLE_SECURITY_URL;
  return GOOGLE_PERMISSIONS_URL;
}

/** Subset compatible with app Finding — keep in sync with app/src/model/findings.ts */

export type FindingKind =
  | "oauth_grant"
  | "connected_app"
  | "ai_agent"
  | "location"
  | "security_alert"
  | "other_access";

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

export type Confidence = "high" | "medium" | "low";

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
  accessTags?: string[];
};

export type ScanResult = {
  findings: Finding[];
  scannedAt: string;
  host: string;
  companionVersion: string;
};

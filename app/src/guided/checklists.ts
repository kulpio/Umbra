import type { Finding } from "../model/findings";
import {
  APPLE_ID_URL,
  APPLE_LOCATION_SUPPORT,
  APPLE_PRIVACY_SECURITY,
  APPLE_SIWA_SUPPORT,
  GOOGLE_ACTIVITY_URL,
  safeRevokeUrl,
} from "../model/findings";

export type GuidedItem = {
  id: string;
  pillar: "access" | "location";
  title: string;
  body: string;
  href: string;
};

export const APPLE_GUIDED: GuidedItem[] = [
  {
    id: "g-apple-siwa",
    pillar: "access",
    title: "Review Sign in with Apple apps",
    body: "Apple ID → Sign-In and Security → Sign in with Apple. Umbra cannot list SIWA apps from the browser.",
    href: APPLE_SIWA_SUPPORT,
  },
  {
    id: "g-apple-id",
    pillar: "access",
    title: "Open Apple ID account page",
    body: "Devices, sign-in, and security for your Apple ID.",
    href: APPLE_ID_URL,
  },
  {
    id: "g-apple-privacy-mac",
    pillar: "access",
    title: "macOS Privacy & Security (TCC-class)",
    body: "System Settings → Privacy & Security (Automation, Full Disk, etc.). Web app never reads TCC.",
    href: APPLE_PRIVACY_SECURITY,
  },
];

export const LOCATION_GUIDED: GuidedItem[] = [
  {
    id: "g-loc-apple",
    pillar: "location",
    title: "Apple Location Services help",
    body: "Always vs While Using, System Services, Significant Locations — on-device only.",
    href: APPLE_LOCATION_SUPPORT,
  },
  {
    id: "g-loc-google",
    pillar: "location",
    title: "Google Activity / Location controls",
    body: "Timeline and activity controls if you use Google location features.",
    href: GOOGLE_ACTIVITY_URL,
  },
];

/** Session-memory guided “I reviewed” findings. */
let guidedFindings: Finding[] = [];

export function listGuidedFindings(): Finding[] {
  return [...guidedFindings];
}

export function clearGuidedFindings(): void {
  guidedFindings = [];
}

export function markGuidedReviewed(item: GuidedItem): Finding {
  const existing = guidedFindings.find((f) => f.id === `guided-${item.id}`);
  if (existing) return existing;
  const f: Finding = {
    id: `guided-${item.id}`,
    kind: item.pillar === "location" ? "location" : "other_access",
    title: `Reviewed: ${item.title}`,
    party: item.pillar === "location" ? "Location checklist" : "Apple / access checklist",
    summary: `${item.body} Marked reviewed in Umbra (guided — not auto-scanned).`,
    evidenceDate: new Date().toISOString().slice(0, 10),
    source: "demo",
    howKnown: "guided",
    ecosystem: item.pillar === "location" ? "device" : "apple",
    confidence: "low",
    revokeUrl: safeRevokeUrl(item.href),
  };
  guidedFindings = [f, ...guidedFindings];
  return f;
}

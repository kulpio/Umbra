import type { Finding } from "../model/findings";
import {
  GOOGLE_ACTIVITY_URL,
  GOOGLE_PERMISSIONS_URL,
  GOOGLE_SECURITY_URL,
} from "../model/findings";

/** Raw message shape used by parsers (Gmail-like). */
export type SampleMessage = {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
};

/** Curated demo map — permissions-first; ≥8 across access / agents / location. */
export const DEMO_FINDINGS: Finding[] = [
  {
    id: "demo-oauth-1",
    kind: "oauth_grant",
    title: "Notion was granted access to your Google Account",
    party: "Notion",
    summary:
      "Third-party OAuth grant. Review whether Notion still needs Drive or Gmail scopes.",
    evidenceDate: "2024-11-03",
    source: "demo",
    confidence: "high",
    revokeUrl: GOOGLE_PERMISSIONS_URL,
    rawSubject:
      "Security alert: Notion was granted access to your Google Account",
  },
  {
    id: "demo-oauth-2",
    kind: "oauth_grant",
    title: "Dropbox was granted access to your Google Account",
    party: "Dropbox",
    summary:
      "OAuth grant for storage integration. Revoke if you no longer sync from Google.",
    evidenceDate: "2023-02-14",
    source: "demo",
    confidence: "high",
    revokeUrl: GOOGLE_PERMISSIONS_URL,
    rawSubject: "Dropbox was granted access to your Google Account",
  },
  {
    id: "demo-conn-1",
    kind: "connected_app",
    title: "IFTTT is connected to your Google Account",
    party: "IFTTT",
    summary:
      "Automation platform still connected. Review applets that touch mail or calendar.",
    evidenceDate: "2022-09-01",
    source: "demo",
    confidence: "medium",
    revokeUrl: GOOGLE_PERMISSIONS_URL,
    rawSubject: "IFTTT is connected to your Google Account",
  },
  {
    id: "demo-conn-2",
    kind: "connected_app",
    title: "Zoom connected for calendar access",
    party: "Zoom",
    summary:
      "Calendar integration. Revoke in Google permissions if you no longer host with Zoom.",
    evidenceDate: "2024-01-22",
    source: "demo",
    confidence: "medium",
    revokeUrl: GOOGLE_PERMISSIONS_URL,
  },
  {
    id: "demo-conn-3",
    kind: "connected_app",
    title: "Slack Sign in with Google",
    party: "Slack",
    summary:
      "Workspace sign-in via Google. Confirm this is a workspace you still use.",
    evidenceDate: "2023-06-18",
    source: "demo",
    confidence: "medium",
    revokeUrl: GOOGLE_PERMISSIONS_URL,
    rawSubject: "Slack: Sign in with Google completed",
  },
  {
    id: "demo-ai-1",
    kind: "ai_agent",
    title: "OpenAI / ChatGPT connected to Google",
    party: "OpenAI",
    summary:
      "AI product with account access. Prefer scoped connectors; revoke unused agent links.",
    evidenceDate: "2025-03-14",
    source: "demo",
    confidence: "high",
    revokeUrl: GOOGLE_PERMISSIONS_URL,
    rawSubject: "OpenAI: app connected to your Google Account",
  },
  {
    id: "demo-ai-2",
    kind: "ai_agent",
    title: "Microsoft Copilot productivity agent",
    party: "Microsoft",
    summary:
      "Assistant-style access to mail or files. Audit what the agent can still read.",
    evidenceDate: "2025-08-02",
    source: "demo",
    confidence: "medium",
    revokeUrl: GOOGLE_PERMISSIONS_URL,
  },
  {
    id: "demo-ai-3",
    kind: "ai_agent",
    title: "Cursor / IDE agent access notice",
    party: "Cursor",
    summary:
      "Dev agent product referenced with account or data access. Confirm scopes still make sense.",
    evidenceDate: "2025-10-01",
    source: "demo",
    confidence: "medium",
    revokeUrl: GOOGLE_PERMISSIONS_URL,
  },
  {
    id: "demo-loc-1",
    kind: "location",
    title: "Location sharing update",
    party: "Google Maps",
    summary:
      "Location sharing or timeline signal. Check who can see your real-time location.",
    evidenceDate: "2024-05-11",
    source: "demo",
    confidence: "medium",
    revokeUrl: GOOGLE_ACTIVITY_URL,
    rawSubject: "Location sharing update for your account",
  },
  {
    id: "demo-loc-2",
    kind: "location",
    title: "Ride app location permission",
    party: "Uber",
    summary:
      "Device location used for trips. Turn off background location if the app is idle.",
    evidenceDate: "2023-12-09",
    source: "demo",
    confidence: "low",
    revokeUrl: GOOGLE_PERMISSIONS_URL,
  },
  {
    id: "demo-loc-3",
    kind: "location",
    title: "Find My Device / device location",
    party: "Google",
    summary:
      "Device location feature mentioned. Review Find My Device and location history controls.",
    evidenceDate: "2024-08-19",
    source: "demo",
    confidence: "medium",
    revokeUrl: GOOGLE_ACTIVITY_URL,
  },
  {
    id: "demo-sec-1",
    kind: "security_alert",
    title: "New sign-in on Windows",
    party: "Google Account",
    summary:
      "New session alert. If it was not you, secure the account and review devices.",
    evidenceDate: "2025-11-20",
    source: "demo",
    confidence: "high",
    revokeUrl: GOOGLE_SECURITY_URL,
    rawSubject: "Security alert: New sign-in on Windows",
  },
  {
    id: "demo-sec-2",
    kind: "security_alert",
    title: "App password or less-secure access path",
    party: "Google Account",
    summary:
      "Legacy access path. Prefer OAuth apps you recognize; remove unused app passwords.",
    evidenceDate: "2021-04-30",
    source: "demo",
    confidence: "medium",
    revokeUrl: GOOGLE_SECURITY_URL,
  },
];

/** Sample raw messages for parser unit tests + live-path dry runs. */
export const SAMPLE_MESSAGES: SampleMessage[] = [
  {
    id: "msg-1",
    subject: "Security alert: Notion was granted access to your Google Account",
    from: "Google <no-reply@accounts.google.com>",
    date: "2024-11-03",
    snippet: "Notion was granted access to your Google Account",
    body: "Notion was granted access to your Google Account. If you did not grant access, review third-party access in your Google Account permissions.",
  },
  {
    id: "msg-2",
    subject: "OpenAI: app connected to your Google Account",
    from: "Google <no-reply@accounts.google.com>",
    date: "2025-03-14",
    snippet: "A new app was connected: OpenAI ChatGPT",
    body: "ChatGPT connected to your Google Account with access to some of your data. Manage connected apps at myaccount.google.com/permissions.",
  },
  {
    id: "msg-3",
    subject: "Security alert: New sign-in on Windows",
    from: "Google <no-reply@accounts.google.com>",
    date: "2025-11-20",
    snippet: "New sign-in on Windows device",
    body: "Your Google Account was just signed in on a Windows device. If this was you, you don't need to do anything.",
  },
  {
    id: "msg-4",
    subject: "Location sharing update for your account",
    from: "Google Maps <maps-noreply@google.com>",
    date: "2024-05-11",
    snippet: "Someone can see your location",
    body: "Location sharing is on. Review who can see your real-time location in Maps settings.",
  },
  {
    id: "msg-5",
    subject: "IFTTT is connected to your Google Account",
    from: "Google <no-reply@accounts.google.com>",
    date: "2022-09-01",
    snippet: "IFTTT connected",
    body: "IFTTT is connected to your Google Account. You can remove access anytime from connected apps settings.",
  },
  {
    id: "msg-6",
    subject: "GitHub: new OAuth application authorized",
    from: "GitHub <noreply@github.com>",
    date: "2024-02-10",
    snippet: "A third-party OAuth application was authorized",
    body: "A third-party application was authorized to access your GitHub account via OAuth.",
  },
  {
    id: "msg-7",
    subject: "Your Uber account location settings",
    from: "Uber <no-reply@uber.com>",
    date: "2023-12-09",
    snippet: "Location access helps pickups",
    body: "We use your device location for pickups and dropoffs. Manage location permissions in your phone settings.",
  },
  {
    id: "msg-8",
    subject: "Slack: Sign in with Google completed",
    from: "Slack <feedback@slack.com>",
    date: "2023-06-18",
    snippet: "Signed in with Google",
    body: "You signed in to Slack using Sign in with Google. Manage connected apps if this was not you.",
  },
  {
    id: "msg-9",
    subject: "Dropbox was granted access to your Google Account",
    from: "Google <no-reply@accounts.google.com>",
    date: "2023-02-14",
    snippet: "Dropbox was granted access",
    body: "Dropbox was granted access to your Google Account. Review third-party access if this was unexpected.",
  },
  {
    id: "msg-10",
    subject: "Anthropic Claude connected via Google",
    from: "Google <no-reply@accounts.google.com>",
    date: "2025-06-01",
    snippet: "Claude AI assistant app connected",
    body: "Claude by Anthropic was connected to your Google Account as an AI assistant with limited data access.",
  },
  {
    id: "msg-11",
    subject: "Security alert: App password created",
    from: "Google <no-reply@accounts.google.com>",
    date: "2021-04-30",
    snippet: "A new app password was created",
    body: "A new app password was created for your Google Account. If you did not do this, review account security.",
  },
  {
    id: "msg-12",
    subject: "Find My Device: location of your phone",
    from: "Google <no-reply@accounts.google.com>",
    date: "2024-08-19",
    snippet: "Device location available",
    body: "Find My Device can show the device location of your phone. Manage device location in account settings.",
  },
  {
    id: "msg-13",
    subject: "Cursor IDE: Google account linked for agent features",
    from: "Cursor <hello@cursor.com>",
    date: "2025-10-01",
    snippet: "AI coding agent linked",
    body: "Your Google account is linked so Cursor AI agent features can sync. Manage access anytime.",
  },
];

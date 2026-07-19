/**
 * Gmail search queries for permission-related signals.
 * Refine as real inboxes teach us false positives.
 */
export const PERMISSION_QUERIES: string[] = [
  'newer_than:2y subject:(access OR connected OR "sign-in" OR "sign in" OR security OR OAuth OR "third-party" OR granted OR permissions)',
  'newer_than:2y from:(accounts.google.com OR no-reply@accounts.google.com) (access OR connected OR security OR granted)',
  'newer_than:2y (OpenAI OR ChatGPT OR Copilot OR "location sharing" OR geofence)',
];

/** Combine with OR for a single list request when preferred. */
export function combinedPermissionQuery(): string {
  return `{${PERMISSION_QUERIES.map((q) => `(${q})`).join(" OR ")}}`;
}

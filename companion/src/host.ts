/**
 * DNS-rebinding defense: only accept Host values that refer to this loopback server.
 * Foreign Host (e.g. evil.com) with a connection to 127.0.0.1 must be rejected.
 */

export function isAllowedLoopbackHost(
  hostHeader: string | string[] | undefined,
  boundPort: number,
): boolean {
  if (hostHeader == null) return false;
  const raw = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  if (!raw || typeof raw !== "string") return false;

  // Strip brackets for IPv6 localhost forms if any; we only bind IPv4
  const host = raw.trim().toLowerCase();

  const allowed = new Set([
    `127.0.0.1:${boundPort}`,
    `localhost:${boundPort}`,
    // browsers occasionally omit default ports — not our case (8787), but
    // also allow host-only if it matches when port is default 80 (we reject)
    "127.0.0.1",
    "localhost",
  ]);

  if (allowed.has(host)) {
    // host-only forms: only OK if boundPort is 80 (never for us) — reject bare host for non-80
    if (host === "127.0.0.1" || host === "localhost") {
      return boundPort === 80;
    }
    return true;
  }

  // Explicit port in header must match bound port
  const m = host.match(/^(127\.0\.0\.1|localhost):(\d+)$/);
  if (m && Number(m[2]) === boundPort) return true;

  return false;
}

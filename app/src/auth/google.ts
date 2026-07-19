/**
 * Google OAuth for SPA — memory-only access token.
 * Uses Google Identity Services token client (implicit for SPA simplicity in v0).
 * Scope: gmail.readonly only (+ openid email when GIS requires identity).
 */

const GMAIL_READONLY = "https://www.googleapis.com/auth/gmail.readonly";
const SCOPES = `openid email ${GMAIL_READONLY}`;

export type AuthState = {
  accessToken: string | null;
  email: string | null;
};

let memoryToken: string | null = null;
let memoryEmail: string | null = null;

export function getClientId(): string {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
}

export function hasClientId(): boolean {
  return getClientId().length > 0;
}

export function getAccessToken(): string | null {
  return memoryToken;
}

export function getAuthEmail(): string | null {
  return memoryEmail;
}

export function disconnect(): void {
  memoryToken = null;
  memoryEmail = null;
}

export function isConnected(): boolean {
  return Boolean(memoryToken);
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (resp: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
    };
  }
}

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("GIS script failed")),
      );
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(s);
  });
}

async function fetchEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { email?: string };
    return data.email || null;
  } catch {
    return null;
  }
}

/**
 * Request gmail.readonly access. Token kept in process memory only.
 */
export async function connectGoogle(): Promise<AuthState> {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error("VITE_GOOGLE_CLIENT_ID is not set");
  }
  await loadGisScript();
  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google Identity Services unavailable");
  }

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: async (resp) => {
        if (resp.error || !resp.access_token) {
          reject(
            new Error(
              resp.error_description || resp.error || "Google auth failed",
            ),
          );
          return;
        }
        memoryToken = resp.access_token;
        memoryEmail = await fetchEmail(resp.access_token);
        resolve({ accessToken: memoryToken, email: memoryEmail });
      },
    });
    client.requestAccessToken({ prompt: "" });
  });
}

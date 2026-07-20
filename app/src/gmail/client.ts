import type { SampleMessage } from "../demo/fixtures";
import { PERMISSION_QUERIES } from "./queries";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

/** Live-scan calibration counters (memory only). */
export type ScanStats = {
  candidatesListed: number;
  metadataFetched: number;
  prefilterPassed: number;
  bodiesFetched: number;
  parsed: number;
  unmatched: number;
};

export function emptyScanStats(): ScanStats {
  return {
    candidatesListed: 0,
    metadataFetched: 0,
    prefilterPassed: 0,
    bodiesFetched: 0,
    parsed: 0,
    unmatched: 0,
  };
}

type ListResponse = {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
};

type MessageResponse = {
  id: string;
  internalDate?: string;
  snippet?: string;
  payload?: {
    headers?: { name: string; value: string }[];
    body?: { data?: string };
    parts?: { mimeType?: string; body?: { data?: string }; parts?: unknown[] }[];
  };
};

/** Cheap subject/from/snippet gate before format=full body download. */
const PREFILTER =
  /access|connected|sign[- ]?in|security|oauth|third-party|granted|permission|openai|chatgpt|claude|copilot|location|geofenc|app password|authorized|agent/i;

function header(
  headers: { name: string; value: string }[] | undefined,
  name: string,
): string {
  if (!headers) return "";
  const h = headers.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value || "";
}

function decodeB64Url(data: string | undefined): string {
  if (!data) return "";
  try {
    const pad = data.replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(pad), (c: string) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
  } catch {
    try {
      return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
    } catch {
      return "";
    }
  }
}

function extractBody(payload: MessageResponse["payload"]): string {
  if (!payload) return "";
  if (payload.body?.data) return decodeB64Url(payload.body.data);
  const parts = payload.parts || [];
  for (const p of parts) {
    if (p.mimeType === "text/plain" && p.body?.data) {
      return decodeB64Url(p.body.data);
    }
  }
  for (const p of parts) {
    if (p.mimeType === "text/html" && p.body?.data) {
      return decodeB64Url(p.body.data).replace(/<[^>]+>/g, " ");
    }
  }
  return "";
}

async function gmailFetch(token: string, path: string): Promise<Response> {
  return fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listCandidateIds(
  token: string,
  maxPerQuery = 25,
): Promise<string[]> {
  const ids = new Set<string>();
  for (const q of PERMISSION_QUERIES) {
    const params = new URLSearchParams({
      q,
      maxResults: String(maxPerQuery),
    });
    const res = await gmailFetch(token, `/messages?${params}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gmail list failed (${res.status}): ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as ListResponse;
    for (const m of data.messages || []) ids.add(m.id);
  }
  return [...ids];
}

/** Metadata-only: headers + snippet, no body parts. */
export async function getMessageMetadata(
  token: string,
  id: string,
): Promise<{ id: string; subject: string; from: string; date: string; snippet: string }> {
  // metadataHeaders repeated for From/Subject/Date (Gmail API multi-value query)
  const path = `/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;
  const res = await gmailFetch(token, path);
  if (!res.ok) {
    throw new Error(`Gmail metadata ${id} failed: ${res.status}`);
  }
  const data = (await res.json()) as MessageResponse;
  const headers = data.payload?.headers;
  let date = header(headers, "Date");
  if (data.internalDate) {
    date = new Date(Number(data.internalDate)).toISOString().slice(0, 10);
  }
  return {
    id: data.id,
    subject: header(headers, "Subject"),
    from: header(headers, "From"),
    date,
    snippet: data.snippet || "",
  };
}

export async function getMessageFull(
  token: string,
  id: string,
): Promise<SampleMessage> {
  const res = await gmailFetch(token, `/messages/${id}?format=full`);
  if (!res.ok) {
    throw new Error(`Gmail get ${id} failed: ${res.status}`);
  }
  const data = (await res.json()) as MessageResponse;
  const headers = data.payload?.headers;
  const subject = header(headers, "Subject");
  const from = header(headers, "From");
  let date = header(headers, "Date");
  if (data.internalDate) {
    date = new Date(Number(data.internalDate)).toISOString().slice(0, 10);
  }
  return {
    id: data.id,
    subject,
    from,
    date,
    snippet: data.snippet || "",
    body: extractBody(data.payload),
  };
}

/** @deprecated use getMessageFull — kept name for callers */
export async function getMessage(
  token: string,
  id: string,
): Promise<SampleMessage> {
  return getMessageFull(token, id);
}

export function passesPrefilter(meta: {
  subject: string;
  from: string;
  snippet: string;
}): boolean {
  const hay = `${meta.subject}\n${meta.from}\n${meta.snippet}`;
  return PREFILTER.test(hay);
}

/**
 * List → metadata prefilter → full body only for passers.
 * Reduces full payload downloads when live Gmail is enabled.
 */
export async function fetchPermissionMessages(
  token: string,
  limit = 40,
): Promise<{ messages: SampleMessage[]; stats: ScanStats }> {
  const stats = emptyScanStats();
  const ids = await listCandidateIds(token);
  stats.candidatesListed = ids.length;
  const slice = ids.slice(0, limit);
  const messages: SampleMessage[] = [];

  for (const id of slice) {
    const meta = await getMessageMetadata(token, id);
    stats.metadataFetched++;
    if (!passesPrefilter(meta)) {
      stats.unmatched++;
      continue;
    }
    stats.prefilterPassed++;
    const full = await getMessageFull(token, id);
    stats.bodiesFetched++;
    messages.push(full);
  }

  return { messages, stats };
}

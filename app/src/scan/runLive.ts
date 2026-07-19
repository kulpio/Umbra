import { getAccessToken } from "../auth/google";
import { fetchPermissionMessages } from "../gmail/client";
import type { Finding } from "../model/findings";
import { findingsFromMessages } from "../parse/fromMessage";

export async function runLiveScan(): Promise<Finding[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not connected. Connect Google first.");
  }
  const messages = await fetchPermissionMessages(token, 40);
  return findingsFromMessages(messages, "gmail");
}

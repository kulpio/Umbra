import { describe, expect, it } from "vitest";
import { SAMPLE_MESSAGES } from "../demo/fixtures";
import { findingFromMessage, findingsFromMessages } from "./fromMessage";

describe("findingFromMessage", () => {
  it("classifies Notion grant as oauth_grant with high confidence", () => {
    const msg = SAMPLE_MESSAGES.find((m) => m.id === "msg-1")!;
    const f = findingFromMessage(msg, "demo");
    expect(f).not.toBeNull();
    expect(f!.kind).toBe("oauth_grant");
    expect(f!.confidence).toBe("high");
    expect(f!.party.toLowerCase()).toContain("notion");
    expect(f!.revokeUrl).toContain("permissions");
  });

  it("classifies OpenAI as ai_agent", () => {
    const msg = SAMPLE_MESSAGES.find((m) => m.id === "msg-2")!;
    const f = findingFromMessage(msg)!;
    expect(f.kind).toBe("ai_agent");
    expect(f.party).toMatch(/OpenAI|ChatGPT/i);
  });

  it("classifies new sign-in as security_alert", () => {
    const msg = SAMPLE_MESSAGES.find((m) => m.id === "msg-3")!;
    const f = findingFromMessage(msg)!;
    expect(f.kind).toBe("security_alert");
  });

  it("classifies location sharing as location", () => {
    const msg = SAMPLE_MESSAGES.find((m) => m.id === "msg-4")!;
    const f = findingFromMessage(msg)!;
    expect(f.kind).toBe("location");
  });

  it("classifies IFTTT as connected_app", () => {
    const msg = SAMPLE_MESSAGES.find((m) => m.id === "msg-5")!;
    const f = findingFromMessage(msg)!;
    expect(f.kind).toBe("connected_app");
  });

  it("returns null for unrelated mail", () => {
    const f = findingFromMessage({
      id: "x",
      subject: "Your receipt from Coffee Shop",
      from: "orders@coffee.example",
      date: "2024-01-01",
      snippet: "Thanks for your purchase $4.50",
      body: "Order #123 paid with card ending 4242",
    });
    expect(f).toBeNull();
  });

  it("parses the fixture corpus into multiple kinds", () => {
    const findings = findingsFromMessages(SAMPLE_MESSAGES, "demo");
    expect(findings.length).toBeGreaterThanOrEqual(5);
    const kinds = new Set(findings.map((f) => f.kind));
    expect(kinds.has("oauth_grant") || kinds.has("connected_app")).toBe(true);
    expect(kinds.has("ai_agent")).toBe(true);
    expect(kinds.has("location")).toBe(true);
    expect(kinds.has("security_alert")).toBe(true);
  });

  it("does not treat subscription/billing alone as a finding", () => {
    const f = findingFromMessage({
      id: "sub",
      subject: "Your Netflix subscription renews tomorrow",
      from: "Netflix <info@netflix.com>",
      date: "2024-06-01",
      snippet: "Billing receipt for monthly plan",
      body: "Your subscription will renew for $15.49.",
    });
    expect(f).toBeNull();
  });
});

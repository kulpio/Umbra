import { describe, expect, it } from "vitest";
import type { Finding } from "../model/findings";
import {
  bucketCountsForChips,
  exportMapSummary,
  sortFindings,
  visibleFindings,
} from "./filter";

function f(
  partial: Partial<Finding> & Pick<Finding, "id" | "kind" | "title" | "party">,
): Finding {
  return {
    summary: "s",
    source: "demo",
    howKnown: "demo",
    ecosystem: "google",
    confidence: "medium",
    ...partial,
  };
}

const sample: Finding[] = [
  f({
    id: "1",
    kind: "oauth_grant",
    title: "Notion grant",
    party: "Notion",
    confidence: "high",
    evidenceDate: "2024-01-01",
    ecosystem: "google",
  }),
  f({
    id: "2",
    kind: "ai_agent",
    title: "OpenAI agent",
    party: "OpenAI",
    confidence: "medium",
    evidenceDate: "2025-06-01",
    ecosystem: "ai",
    howKnown: "manual",
  }),
  f({
    id: "3",
    kind: "location",
    title: "Maps sharing",
    party: "Google Maps",
    confidence: "low",
    evidenceDate: "2023-01-01",
    ecosystem: "google",
  }),
  f({
    id: "4",
    kind: "security_alert",
    title: "New sign-in",
    party: "Google",
    confidence: "high",
    evidenceDate: "2025-06-01",
  }),
];

describe("visibleFindings", () => {
  it("hides dismissed unless showDismissed", () => {
    const dismissed = new Set(["1"]);
    const hidden = visibleFindings(sample, {
      dismissed,
      showDismissed: false,
      filter: "all",
      search: "",
    });
    expect(hidden.map((x) => x.id)).not.toContain("1");
    expect(hidden.length).toBe(3);

    const shown = visibleFindings(sample, {
      dismissed,
      showDismissed: true,
      filter: "all",
      search: "",
    });
    expect(shown.map((x) => x.id)).toContain("1");
    expect(shown.length).toBe(4);
  });

  it("filters by bucket", () => {
    const list = visibleFindings(sample, {
      dismissed: new Set(),
      showDismissed: false,
      filter: "agents",
      search: "",
    });
    expect(list).toHaveLength(1);
    expect(list[0].party).toBe("OpenAI");
  });

  it("searches ecosystem and party", () => {
    const list = visibleFindings(sample, {
      dismissed: new Set(),
      showDismissed: false,
      filter: "all",
      search: "apple",
    });
    // none apple in sample
    expect(list).toHaveLength(0);
    const notion = visibleFindings(sample, {
      dismissed: new Set(),
      showDismissed: false,
      filter: "all",
      search: "notion",
    });
    expect(notion).toHaveLength(1);
  });
});

describe("sortFindings", () => {
  it("sorts newest date first, then confidence", () => {
    const sorted = sortFindings(sample);
    expect(sorted[0].id).toBe("4");
    expect(sorted[1].id).toBe("2");
    expect(sorted[2].id).toBe("1");
    expect(sorted[3].id).toBe("3");
  });
});

describe("bucketCountsForChips", () => {
  it("reflects dismiss and search", () => {
    const c = bucketCountsForChips(sample, {
      dismissed: new Set(["2"]),
      showDismissed: false,
      search: "",
    });
    expect(c.all).toBe(3);
    expect(c.agents).toBe(0);
    expect(c.access).toBe(1);
    expect(c.location).toBe(1);
    expect(c.alerts).toBe(1);
  });
});

describe("exportMapSummary", () => {
  it("exports text with ecosystem", () => {
    const text = exportMapSummary(sample.slice(0, 1), "text");
    expect(text).toContain("Notion");
    expect(text).toContain("google");
    expect(text).not.toContain("rawSubject");
  });

  it("exports json rows with ecosystem", () => {
    const j = JSON.parse(exportMapSummary(sample.slice(0, 2), "json"));
    expect(j.findings[0].ecosystem).toBe("google");
    expect(j.findings[1].howKnown).toBe("manual");
    expect(j.findings[0].body).toBeUndefined();
  });
});

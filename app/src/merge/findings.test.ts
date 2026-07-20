import { describe, expect, it } from "vitest";
import type { Finding } from "../model/findings";
import { mergeFindings, parseImportPayload } from "./findings";

function f(partial: Partial<Finding> & Pick<Finding, "id" | "title" | "party">): Finding {
  return {
    kind: "ai_agent",
    summary: "s",
    source: "demo",
    ecosystem: "ai",
    howKnown: "demo",
    confidence: "medium",
    ...partial,
  };
}

describe("mergeFindings", () => {
  it("dedupes by kind+party+title", () => {
    const a = f({ id: "1", title: "Cursor on Mac", party: "Cursor", howKnown: "demo" });
    const b = f({
      id: "2",
      title: "Cursor on Mac",
      party: "Cursor",
      howKnown: "local_scan",
    });
    const m = mergeFindings([a], [b]);
    expect(m).toHaveLength(1);
    expect(m[0].howKnown).toBe("local_scan");
  });
});

describe("parseImportPayload", () => {
  it("parses companion scan JSON", () => {
    const list = parseImportPayload({
      findings: [
        f({ id: "local-1", title: "Ollama process", party: "Ollama", howKnown: "local_scan" }),
      ],
      scannedAt: "2025-01-01",
    });
    expect(list).toHaveLength(1);
    expect(list[0].howKnown).toBe("local_scan");
  });
});

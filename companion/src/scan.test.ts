import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runScanWithDeps, type FsLike } from "./scan.js";

function fakeFs(tree: Record<string, string[] | "file">): FsLike {
  return {
    existsSync: (p) => p in tree || Object.keys(tree).some((k) => k.startsWith(p + "/")),
    readdirSync: (p) => {
      const v = tree[p];
      if (Array.isArray(v)) return v;
      return [];
    },
    statSync: () => ({
      isDirectory: () => true,
      mtime: new Date("2025-01-15T00:00:00Z"),
    }),
  };
}

describe("runScanWithDeps", () => {
  it("detects app names and home dirs without reading secrets", () => {
    const home = "/fake/home";
    const apps = "/fake/Applications";
    const launch = `${home}/Library/LaunchAgents`;
    const fs = fakeFs({
      [apps]: ["Cursor.app", "Slack.app", "Claude.app"],
      [home + "/.cursor"]: "file",
      [launch]: ["com.cursor.helper.plist", "com.apple.something.plist"],
    });
    // existsSync for dirs: mark paths
    const base = fakeFs({
      [apps]: ["Cursor.app", "Slack.app", "Claude.app"],
      [launch]: ["com.cursor.helper.plist", "com.apple.something.plist"],
    });
    const fsl: FsLike = {
      existsSync: (p) => {
        if (p === apps || p === launch) return true;
        if (p === `${home}/.cursor`) return true;
        if (p.endsWith("Cursor.app") || p.endsWith("Claude.app")) return true;
        if (p.includes("LaunchAgents")) return true;
        return base.existsSync(p);
      },
      readdirSync: (p) => {
        if (p === apps) return ["Cursor.app", "Slack.app", "Claude.app"];
        if (p === launch) return ["com.cursor.helper.plist", "com.apple.something.plist"];
        return [];
      },
      statSync: () => ({
        isDirectory: () => true,
        mtime: new Date("2025-01-15T00:00:00Z"),
      }),
    };

    const result = runScanWithDeps({
      home,
      applicationsDirs: [apps],
      launchAgentsDir: launch,
      fs: fsl,
      processLines: ["/usr/local/bin/ollama", "/bin/zsh"],
      hostname: "test-host",
      now: new Date("2025-06-01T12:00:00Z"),
    });

    assert.ok(result.findings.length >= 3);
    assert.equal(result.host, "test-host");
    assert.ok(result.findings.every((f) => f.howKnown === "local_scan"));
    assert.ok(result.findings.some((f) => f.party === "Cursor"));
    assert.ok(result.findings.some((f) => f.party === "Claude"));
    assert.ok(result.findings.some((f) => f.party === "Ollama"));
    assert.ok(result.findings.some((f) => f.id.includes("launch")));
    // Slack should not match AI patterns
    assert.ok(!result.findings.some((f) => f.party === "Slack"));
    // summaries must not look like dumped tokens
    for (const f of result.findings) {
      assert.ok(!/sk-[a-zA-Z0-9]{10,}/.test(f.summary));
      assert.ok(!/api[_-]?key/i.test(f.summary) || f.summary.includes("not read"));
    }
  });

  it("matchAppName maps Cursor.app", async () => {
    const { matchAppName } = await import("./patterns.js");
    assert.equal(matchAppName("Cursor.app")?.party, "Cursor");
    assert.equal(matchAppName("TotallyNormal.app"), undefined);
  });
});

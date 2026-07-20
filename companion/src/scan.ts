import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  APP_PATTERNS,
  HOME_DIR_HINTS,
  LAUNCH_AGENT_MATCH,
  matchAppName,
  type AppPattern,
} from "./patterns.js";
import type { Finding, ScanResult } from "./types.js";

const VERSION = "0.1.0";

export type FsLike = {
  readdirSync: (p: string) => string[];
  statSync: (p: string) => { isDirectory: () => boolean; mtime: Date };
  existsSync: (p: string) => boolean;
};

export type ScanDeps = {
  home: string;
  applicationsDirs: string[];
  launchAgentsDir: string;
  fs: FsLike;
  processLines: string[];
  now?: Date;
  hostname?: string;
};

function safeReaddir(fsl: FsLike, dir: string): string[] {
  try {
    if (!fsl.existsSync(dir)) return [];
    return fsl.readdirSync(dir);
  } catch {
    return [];
  }
}

function mtimeIso(fsl: FsLike, p: string): string | undefined {
  try {
    return fsl.statSync(p).mtime.toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
}

function findingFromPattern(
  pattern: AppPattern,
  signal: string,
  detail: string,
  evidenceDate?: string,
): Finding {
  return {
    id: `local-${pattern.id}-${signal}`,
    kind: pattern.kind,
    title: `${pattern.party} on this Mac (${signal})`,
    party: pattern.party,
    summary: `${pattern.summary} Signal: ${detail}. Names/paths only — config files never opened.`,
    evidenceDate,
    source: "demo",
    ecosystem: "ai",
    howKnown: "local_scan",
    confidence: pattern.confidence,
  };
}

/** Injectable scan for unit tests. */
export function runScanWithDeps(deps: ScanDeps): ScanResult {
  const findings: Finding[] = [];
  const seen = new Set<string>();
  const now = deps.now ?? new Date();
  const today = now.toISOString().slice(0, 10);

  const push = (f: Finding) => {
    if (seen.has(f.id)) return;
    seen.add(f.id);
    findings.push(f);
  };

  for (const dir of deps.applicationsDirs) {
    for (const name of safeReaddir(deps.fs, dir)) {
      const pat = matchAppName(name);
      if (!pat) continue;
      const full = path.join(dir, name);
      push(
        findingFromPattern(
          pat,
          "app",
          `Found ${name} under ${dir}`,
          mtimeIso(deps.fs, full) || today,
        ),
      );
    }
  }

  for (const hint of HOME_DIR_HINTS) {
    const full = path.join(deps.home, hint.rel);
    if (!deps.fs.existsSync(full)) continue;
    push({
      id: `local-dir-${hint.id}`,
      kind: "ai_agent",
      title: `${hint.party} folder: ~/${hint.rel}`,
      party: hint.party,
      summary: `Directory exists at ~/${hint.rel} (mtime only; contents not read).`,
      evidenceDate: mtimeIso(deps.fs, full) || today,
      source: "demo",
      ecosystem: "device",
      howKnown: "local_scan",
      confidence: "medium",
    });
  }

  for (const name of safeReaddir(deps.fs, deps.launchAgentsDir)) {
    if (!name.endsWith(".plist")) continue;
    if (!LAUNCH_AGENT_MATCH.test(name)) continue;
    const full = path.join(deps.launchAgentsDir, name);
    const pat = matchAppName(name);
    push({
      id: `local-launch-${name}`,
      kind: "ai_agent",
      title: `LaunchAgent: ${name}`,
      party: pat?.party || "Agent-related LaunchAgent",
      summary: `User LaunchAgent basename matches AI/agent pattern. Plist body not read (no secrets).`,
      evidenceDate: mtimeIso(deps.fs, full) || today,
      source: "demo",
      ecosystem: "device",
      howKnown: "local_scan",
      confidence: "medium",
    });
  }

  for (const line of deps.processLines) {
    for (const pat of APP_PATTERNS) {
      if (!pat.match.test(line)) continue;
      push(
        findingFromPattern(
          pat,
          "process",
          "Matching process name in one-shot process list",
          today,
        ),
      );
    }
  }

  return {
    findings,
    scannedAt: now.toISOString(),
    host: deps.hostname || os.hostname(),
    companionVersion: VERSION,
  };
}

function realProcessLines(): string[] {
  try {
    const out = execFileSync("ps", ["-axo", "comm="], {
      encoding: "utf8",
      maxBuffer: 2 * 1024 * 1024,
    });
    return out.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export function runLocalScan(): ScanResult {
  const home = os.homedir();
  return runScanWithDeps({
    home,
    applicationsDirs: ["/Applications", path.join(home, "Applications")],
    launchAgentsDir: path.join(home, "Library", "LaunchAgents"),
    fs: {
      readdirSync: (p) => fs.readdirSync(p),
      statSync: (p) => fs.statSync(p),
      existsSync: (p) => fs.existsSync(p),
    },
    processLines: realProcessLines(),
  });
}

export function writeScanFile(result: ScanResult, outPath: string): void {
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf8");
}

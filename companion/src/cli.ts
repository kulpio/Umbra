#!/usr/bin/env node
import path from "node:path";
import { runLocalScan, writeScanFile } from "./scan.js";
import { startServer } from "./server.js";

const cmd = process.argv[2] || "scan";

if (cmd === "scan") {
  const out =
    process.argv[3] || path.join(process.cwd(), "umbra-local-scan.json");
  console.log("Scanning (read-only, names/paths only — no secrets)…");
  const result = runLocalScan();
  writeScanFile(result, out);
  console.log(
    `Wrote ${result.findings.length} findings → ${out} (host ${result.host})`,
  );
  process.exit(0);
}

if (cmd === "serve") {
  const port = Number(process.env.UMBRA_COMPANION_PORT || 8787);
  startServer(port);
  // keep process alive
} else {
  console.error("Usage: npm run scan | npm run serve");
  process.exit(1);
}

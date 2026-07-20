import http from "node:http";
import type { AddressInfo } from "node:net";
import { runLocalScan } from "./scan.js";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function cors(req: http.IncomingMessage, res: http.ServerResponse): void {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * Bind 127.0.0.1 only. Reject non-loopback (host already forces loopback).
 */
export function startServer(port = 8787): http.Server {
  const server = http.createServer((req, res) => {
    cors(req, res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", "http://127.0.0.1");

    if (req.method === "GET" && url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, service: "umbra-companion" }));
      return;
    }

    if (req.method === "GET" && url.pathname === "/scan") {
      try {
        const result = runLocalScan();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: e instanceof Error ? e.message : String(e),
          }),
        );
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });

  server.listen(port, "127.0.0.1", () => {
    const addr = server.address() as AddressInfo;
    console.log(
      `Umbra companion listening on http://127.0.0.1:${addr.port} (loopback only)`,
    );
    console.log("  GET /health  GET /scan");
  });

  return server;
}

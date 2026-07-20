import http from "node:http";
import type { AddressInfo } from "node:net";
import { isAllowedLoopbackHost } from "./host.js";
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
 * Bind 127.0.0.1 only + reject bad Host (DNS rebinding).
 */
export function startServer(port = 8787): http.Server {
  const server = http.createServer((req, res) => {
    cors(req, res);

    // Resolve bound port for Host checks (may differ if 0 was passed)
    const addr = server.address();
    const boundPort =
      addr && typeof addr === "object" ? addr.port : port;

    if (!isAllowedLoopbackHost(req.headers.host, boundPort)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "invalid host",
          detail: "Host must be 127.0.0.1 or localhost with this server port",
        }),
      );
      return;
    }

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
    const a = server.address() as AddressInfo;
    console.log(
      `Umbra companion listening on http://127.0.0.1:${a.port} (loopback only; Host must match)`,
    );
    console.log("  GET /health  GET /scan");
  });

  return server;
}

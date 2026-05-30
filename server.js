import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = process.env.PORT || 3000;
const build = "OX-004";
const forgeHost = "forge.oddsxray.com";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.join(__dirname, "index.html");

const sendJson = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2));
};

const sendHtml = (res, status, body) => {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
  res.end(body);
};

const readBody = (req) => new Promise((resolve) => {
  let data = "";
  req.on("data", chunk => data += chunk);
  req.on("end", () => resolve(data));
});

const proxyForge = (forgePath, method = "GET", body = "") => new Promise((resolve) => {
  const headers = { "accept": "application/json" };
  if (body) {
    headers["content-type"] = "application/json";
    headers["content-length"] = Buffer.byteLength(body);
  }

  const req = http.request({ hostname: forgeHost, port: 80, path: forgePath, method, headers, timeout: 6000 }, (forgeRes) => {
    let data = "";
    forgeRes.on("data", chunk => data += chunk);
    forgeRes.on("end", () => {
      try {
        resolve({ status: forgeRes.statusCode || 502, body: JSON.parse(data) });
      } catch {
        resolve({ status: 502, body: { ok: false, error: "Forge returned non-JSON", raw: data.slice(0, 500) } });
      }
    });
  });
  req.on("timeout", () => { req.destroy(); resolve({ status: 504, body: { ok: false, error: "Forge timeout" } }); });
  req.on("error", err => resolve({ status: 502, body: { ok: false, error: "Forge proxy error", detail: err.message } }));
  if (body) req.write(body);
  req.end();
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/health") {
    return sendJson(res, 200, { ok: true, app: "Odds X-Ray", layer: "The Ox", build, status: "online", forge_proxy: "/api/forge/health" });
  }

  if (url.pathname === "/api/forge/health") {
    const out = await proxyForge("/health", "GET");
    return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body });
  }

  if (req.method === "GET" && url.pathname === "/api/forge/scenarios") {
    const out = await proxyForge("/api/scenarios", "GET");
    return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body });
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/forge/scenarios/")) {
    const id = url.pathname.split("/").pop();
    const out = await proxyForge(`/api/scenarios/${encodeURIComponent(id)}`, "GET");
    return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body });
  }

  if (req.method === "POST" && url.pathname === "/api/forge/attempts") {
    const body = await readBody(req);
    const out = await proxyForge("/api/attempts", "POST", body || "{}");
    return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body });
  }

  if (req.method === "GET" && url.pathname === "/api/forge/attempts") {
    const out = await proxyForge("/api/attempts", "GET");
    return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body });
  }

  if (req.method === "POST" && url.pathname.match(/^\/api\/forge\/attempts\/[^/]+\/choice$/)) {
    const attemptId = url.pathname.split("/")[4];
    const body = await readBody(req);
    const out = await proxyForge(`/api/attempts/${encodeURIComponent(attemptId)}/choice`, "POST", body || "{}");
    return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body });
  }

  if (req.method === "GET" && url.pathname.match(/^\/api\/forge\/attempts\/[^/]+$/)) {
    const attemptId = url.pathname.split("/").pop();
    const out = await proxyForge(`/api/attempts/${encodeURIComponent(attemptId)}`, "GET");
    return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body });
  }

  if (req.method === "GET" && url.pathname === "/api/forge/progress") {
    const out = await proxyForge("/api/progress", "GET");
    return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body });
  }

  if (url.pathname === "/app" || url.pathname === "/app/" || url.pathname === "/app/products" || url.pathname === "/app/second-stake" || url.pathname === "/app/second-stake/scenarios/green-number-trap" || url.pathname === "/app/history" || url.pathname === "/") {
    const page = fs.readFileSync(indexPath, "utf8").replaceAll("OX-001", build).replaceAll("OX-001E", build).replaceAll("OX-002", build).replaceAll("OX-003", build);
    return sendHtml(res, 200, page);
  }

  return sendJson(res, 404, { ok: false, error: "Route not found", build });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`The Ox ${build} running on port ${port}`);
});

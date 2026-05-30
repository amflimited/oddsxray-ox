import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = process.env.PORT || 3000;
const build = "OX-002";
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

const fetchForge = (forgePath) => new Promise((resolve) => {
  const req = http.request({ hostname: forgeHost, port: 80, path: forgePath, method: "GET", timeout: 5000 }, (forgeRes) => {
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
  req.end();
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/health") {
    return sendJson(res, 200, { ok: true, app: "Odds X-Ray", layer: "The Ox", build, status: "online", forge_proxy: "/api/forge/health" });
  }

  if (url.pathname === "/api/forge/health") {
    const out = await fetchForge("/health");
    return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body });
  }

  if (url.pathname === "/api/forge/scenarios") {
    const out = await fetchForge("/api/scenarios");
    return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body });
  }

  if (url.pathname.startsWith("/api/forge/scenarios/")) {
    const id = url.pathname.split("/").pop();
    const out = await fetchForge(`/api/scenarios/${encodeURIComponent(id)}`);
    return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body });
  }

  if (url.pathname === "/app" || url.pathname === "/app/" || url.pathname === "/app/products" || url.pathname === "/app/second-stake" || url.pathname === "/app/second-stake/scenarios/green-number-trap" || url.pathname === "/") {
    const page = fs.readFileSync(indexPath, "utf8").replaceAll("OX-001", build).replaceAll("OX-001E", build);
    return sendHtml(res, 200, page);
  }

  return sendJson(res, 404, { ok: false, error: "Route not found", build });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`The Ox ${build} running on port ${port}`);
});

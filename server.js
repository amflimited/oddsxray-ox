import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = process.env.PORT || 3000;
const build = "OX-009E";
const expectedForgeBuild = "FORGE-006A";
const forgeHost = "forge.oddsxray.com";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.join(__dirname, "index.html");

const forgeSelfPullScript = `#!/usr/bin/env bash
set -euo pipefail
mkdir -p /var/log/oddsxray-forge /opt/oddsxray-forge/bin
cat > /usr/local/bin/forgepull <<'PULL'
#!/usr/bin/env bash
set -euo pipefail
LOG=/var/log/oddsxray-forge/forgepull.log
TMP=$(mktemp /tmp/forge-current.XXXXXX.sh)
cleanup(){ rm -f "$TMP"; }
trap cleanup EXIT
echo "[$(date -Is)] forgepull check" >> "$LOG"
curl -fsSL "http://ox.oddsxray.com/forge-current.sh?pull=$(date +%s)" -o "$TMP"
chmod +x "$TMP"
TARGET=$(grep -m1 '^BUILD=' "$TMP" | cut -d'"' -f2 || true)
CURRENT=$(curl -fsS http://127.0.0.1:3001/health 2>/dev/null | grep -o '"build"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4 || true)
if [ -z "$TARGET" ]; then
  echo "[$(date -Is)] no target build found in package" >> "$LOG"
  exit 2
fi
if [ "$TARGET" = "$CURRENT" ]; then
  echo "[$(date -Is)] current=$CURRENT target=$TARGET no-op" >> "$LOG"
  exit 0
fi
echo "[$(date -Is)] updating current=\${CURRENT:-none} target=$TARGET" >> "$LOG"
bash "$TMP" >> "$LOG" 2>&1
AFTER=$(curl -fsS http://127.0.0.1:3001/health 2>/dev/null | grep -o '"build"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4 || true)
echo "[$(date -Is)] after=$AFTER" >> "$LOG"
test "$AFTER" = "$TARGET"
PULL
chmod +x /usr/local/bin/forgepull
cat > /etc/systemd/system/oddsxray-forge-pull.service <<'UNIT'
[Unit]
Description=Odds X-Ray Forge self-pull updater
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/forgepull
UNIT
cat > /etc/systemd/system/oddsxray-forge-pull.timer <<'UNIT'
[Unit]
Description=Run Odds X-Ray Forge self-pull updater every minute

[Timer]
OnBootSec=30s
OnUnitActiveSec=60s
RandomizedDelaySec=8s
Persistent=true
Unit=oddsxray-forge-pull.service

[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now oddsxray-forge-pull.timer >/dev/null
systemctl start oddsxray-forge-pull.service || true
echo "Forge self-pull updater installed."
echo "Manual update: forgepull"
echo "Log: /var/log/oddsxray-forge/forgepull.log"
systemctl list-timers oddsxray-forge-pull.timer --no-pager || true
`;

const forgeBootstrapScript = `#!/usr/bin/env bash
set -euo pipefail
curl -fsSL http://ox.oddsxray.com/forge-selfpull-install.sh | bash
forgepull
`;

const sendJson = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body, null, 2));
};
const sendText = (res, status, body, contentType = "text/plain; charset=utf-8") => {
  res.writeHead(status, { "content-type": contentType, "cache-control": "no-store" });
  res.end(body);
};
const sendHtml = (res, status, body) => {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  res.end(body);
};
const serveRepoFile = (res, relPath, contentType) => {
  const safePath = relPath.split("/").filter(Boolean).join("/");
  const fullPath = path.join(__dirname, safePath);
  if (!fullPath.startsWith(__dirname) || !fs.existsSync(fullPath)) return sendText(res, 404, "Not found\n");
  return sendText(res, 200, fs.readFileSync(fullPath, "utf8"), contentType);
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
  const upstream = http.request({ hostname: forgeHost, port: 80, path: forgePath, method, headers, timeout: 8000 }, (forgeRes) => {
    let data = "";
    forgeRes.on("data", chunk => data += chunk);
    forgeRes.on("end", () => {
      try { resolve({ status: forgeRes.statusCode || 502, body: JSON.parse(data) }); }
      catch { resolve({ status: 502, body: { ok: false, error: "Forge returned non-JSON", raw: data.slice(0, 500) } }); }
    });
  });
  upstream.on("timeout", () => { upstream.destroy(); resolve({ status: 504, body: { ok: false, error: "Forge timeout" } }); });
  upstream.on("error", err => resolve({ status: 502, body: { ok: false, error: "Forge proxy error", detail: err.message } }));
  if (body) upstream.write(body);
  upstream.end();
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname === "/f" || url.pathname === "/forgeup") return sendText(res, 200, forgeBootstrapScript, "text/x-shellscript; charset=utf-8");
  if (url.pathname === "/forge-selfpull-install.sh" || url.pathname === "/forge-selfpull") return sendText(res, 200, forgeSelfPullScript, "text/x-shellscript; charset=utf-8");
  if (url.pathname === "/forge-current.sh" || url.pathname === "/forge-current") return serveRepoFile(res, "forge-current.sh", "text/x-shellscript; charset=utf-8");
  if (url.pathname === "/api/deploy-target") return sendJson(res, 200, { ok: true, ox_build: build, forge_build: expectedForgeBuild, forge_current: "/forge-current.sh", forge_selfpull_install: "/forge-selfpull-install.sh" });
  if (url.pathname === "/health") return sendJson(res, 200, { ok: true, app: "Odds X-Ray", layer: "The Ox", build, status: "online", expected_forge_build: expectedForgeBuild, forge_proxy: "/api/forge/health", packages: "/api/packages", deploy_target: "/api/deploy-target", forge_current: "/forge-current.sh", forge_selfpull_install: "/forge-selfpull-install.sh" });
  if (url.pathname === "/api/packages") {
    const out = await proxyForge("/health");
    return sendJson(res, 200, { ok: true, ox: { app: "Odds X-Ray", layer: "The Ox", build, status: "online" }, forge: out.body, expected: { ox_build: build, forge_build: expectedForgeBuild }, deploy: { mode: "forge-self-pull", interval_seconds: 60, install: "curl -fsSL ox.oddsxray.com/forge-selfpull-install.sh|bash" }, forge_status_code: out.status });
  }
  if (url.pathname === "/api/forge/health") {
    const out = await proxyForge("/health");
    return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, expected_forge_build: expectedForgeBuild, proxied_from: "The Forge", forge: out.body });
  }
  if (req.method === "GET" && url.pathname === "/api/forge/catalog") { const out = await proxyForge("/api/catalog"); return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body }); }
  if (req.method === "GET" && url.pathname === "/api/forge/scenarios") { const out = await proxyForge("/api/scenarios"); return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body }); }
  if (req.method === "GET" && url.pathname.startsWith("/api/forge/scenarios/")) { const id = url.pathname.split("/").pop(); const out = await proxyForge(`/api/scenarios/${encodeURIComponent(id)}`); return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body }); }
  if (req.method === "POST" && url.pathname === "/api/forge/attempts") { const body = await readBody(req); const out = await proxyForge("/api/attempts", "POST", body || "{}"); return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body }); }
  if (req.method === "GET" && url.pathname === "/api/forge/attempts") { const out = await proxyForge("/api/attempts"); return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body }); }
  if (req.method === "POST" && url.pathname.match(/^\/api\/forge\/attempts\/[^/]+\/choice$/)) { const attemptId = url.pathname.split("/")[4]; const body = await readBody(req); const out = await proxyForge(`/api/attempts/${encodeURIComponent(attemptId)}/choice`, "POST", body || "{}"); return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body }); }
  if (req.method === "GET" && url.pathname.match(/^\/api\/forge\/attempts\/[^/]+$/)) { const attemptId = url.pathname.split("/").pop(); const out = await proxyForge(`/api/attempts/${encodeURIComponent(attemptId)}`); return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body }); }
  if (req.method === "GET" && url.pathname === "/api/forge/progress") { const out = await proxyForge("/api/progress"); return sendJson(res, out.status, { ok: out.status < 400, ox_build: build, proxied_from: "The Forge", forge: out.body }); }
  if (url.pathname === "/" || url.pathname.startsWith("/app")) return sendHtml(res, 200, fs.readFileSync(indexPath, "utf8"));
  return sendJson(res, 404, { ok: false, error: "Route not found", build });
});
server.listen(port, "0.0.0.0", () => console.log(`The Ox ${build} running on port ${port}`));

#!/usr/bin/env bash
set -e

BUILD="FORGE-001"
APP_DIR="/opt/oddsxray-forge"

export DEBIAN_FRONTEND=noninteractive

apt update
apt install -y curl nginx nodejs npm

mkdir -p "$APP_DIR/data"
cd "$APP_DIR"

cat > data/scenarios.json <<'JSON'
[
  {
    "id": "green-number-trap",
    "module": "second-stake",
    "title": "The Green Number Trap",
    "scar": "A green number is not a plan.",
    "status": "seeded",
    "nodes": [
      {
        "id": "start",
        "prompt": "The position is showing green. You feel smarter than you did ten minutes ago. The screen is offering you an exit, but the story in your head says there might be more.",
        "choices": [
          { "id": "exit", "label": "Take the exit", "next": "exit-result" },
          { "id": "pull-stake", "label": "Pull stake, leave the rest", "next": "stake-result" },
          { "id": "one-more", "label": "Wait one more tick", "next": "trap-result" },
          { "id": "hold", "label": "Hold because it still feels obvious", "next": "trap-result" }
        ]
      },
      {
        "id": "trap-result",
        "result": "The window closes. The number turns. You wait for the bounce. It never comes.",
        "diagnosis": "You treated being up as proof, not as an exit signal.",
        "scar": "A green number is not a plan."
      },
      {
        "id": "exit-result",
        "result": "You left with the win before the market made you negotiate with yourself.",
        "diagnosis": "You respected the exit while it existed.",
        "scar": "The cash-out window is a door, not a promise."
      },
      {
        "id": "stake-result",
        "result": "You protected the original damage zone and left yourself upside without letting the market hold your whole throat.",
        "diagnosis": "You separated survival from greed.",
        "scar": "First protect the stake. Then decide what risk deserves to stay alive."
      }
    ]
  }
]
JSON

cat > package.json <<'JSON'
{
  "name": "oddsxray-forge",
  "version": "0.0.1",
  "type": "module",
  "scripts": { "start": "node server.js" }
}
JSON

cat > server.js <<'JS'
import http from "node:http";
import fs from "node:fs";

const PORT = process.env.PORT || 3001;
const BUILD = "FORGE-001";
const scenarios = JSON.parse(fs.readFileSync("./data/scenarios.json", "utf8"));

function send(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  res.end(JSON.stringify(body, null, 2));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") return send(res, 204, {});

  if (url.pathname === "/health") {
    return send(res, 200, { ok: true, app: "Odds X-Ray", layer: "The Forge", build: BUILD, status: "online" });
  }

  if (url.pathname === "/api/scenarios") {
    return send(res, 200, {
      ok: true,
      build: BUILD,
      scenarios: scenarios.map(s => ({ id: s.id, module: s.module, title: s.title, scar: s.scar, status: s.status }))
    });
  }

  if (url.pathname.startsWith("/api/scenarios/")) {
    const id = url.pathname.split("/").pop();
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return send(res, 404, { ok: false, error: "Scenario not found", build: BUILD });
    return send(res, 200, { ok: true, build: BUILD, scenario });
  }

  return send(res, 404, { ok: false, error: "Route not found", build: BUILD });
});

server.listen(PORT, "127.0.0.1", () => console.log(`The Forge ${BUILD} running on ${PORT}`));
JS

cat > /etc/systemd/system/oddsxray-forge.service <<'UNIT'
[Unit]
Description=Odds X-Ray Forge API
After=network.target

[Service]
WorkingDirectory=/opt/oddsxray-forge
ExecStart=/usr/bin/node /opt/oddsxray-forge/server.js
Restart=always
RestartSec=3
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable oddsxray-forge
systemctl restart oddsxray-forge

cat > /etc/nginx/sites-available/oddsxray-forge <<'NGINX'
server {
    listen 80;
    server_name forge.oddsxray.com 209.74.83.238;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/oddsxray-forge /etc/nginx/sites-enabled/oddsxray-forge
if [ -e /etc/nginx/sites-enabled/default ]; then mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.disabled; fi
nginx -t
systemctl reload nginx

curl -s http://127.0.0.1:3001/health

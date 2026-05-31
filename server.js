import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleLocalForge, localForgeBuild } from "./local-forge.js";

const port = process.env.PORT || 3000;
const build = "OX-011A";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.join(__dirname, "index.html");

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body, null, 2));
}

function text(res, status, body) {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
  res.end(body);
}

function html(res, body) {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/health") {
      return json(res, 200, {
        ok: true,
        app: "Odds X-Ray",
        layer: "The Ox",
        build,
        status: "online",
        architecture: "single-runtime",
        forge_runtime: "inside-ox",
        forge_build: localForgeBuild,
        packages: "/api/packages"
      });
    }

    if (url.pathname === "/api/packages") {
      return json(res, 200, {
        ok: true,
        ox: { app: "Odds X-Ray", layer: "The Ox", build, status: "online" },
        forge: { ok: true, layer: "The Forge", build: localForgeBuild, status: "online", runtime: "inside-ox", active_scenario: "s01-the-180-window", game_mode: "single_runtime_tracked_evidence" },
        expected: { ox_build: build, forge_build: localForgeBuild },
        deploy: { mode: "single-runtime-hyperlift", manual_commands_required: false }
      });
    }

    if (url.pathname === "/f" || url.pathname === "/forgeup" || url.pathname === "/forge-current.sh" || url.pathname === "/forge-selfpull-install.sh") {
      return text(res, 410, "Deprecated. Forge now runs inside Ox. Product deploys happen through the normal Ox Hyperlift deploy.\n");
    }

    if (url.pathname.startsWith("/api/forge/")) {
      const localPath = url.pathname.replace(/^\/api\/forge/, "/api");
      return handleLocalForge(req, res, localPath);
    }

    if (url.pathname === "/api/deploy-target") {
      return json(res, 200, { ok: true, ox_build: build, forge_build: localForgeBuild, deploy_mode: "single-runtime-hyperlift", manual_commands_required: false });
    }

    if (url.pathname === "/" || url.pathname.startsWith("/app")) {
      return html(res, fs.readFileSync(indexPath, "utf8"));
    }

    return json(res, 404, { ok: false, error: "Route not found", build });
  } catch (error) {
    return json(res, 500, { ok: false, error: "Ox runtime error", detail: error?.message || String(error), build });
  }
});

server.listen(port, "0.0.0.0", () => console.log(`The Ox ${build} running on port ${port}; local Forge ${localForgeBuild}.`));

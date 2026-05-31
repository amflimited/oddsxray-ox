import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleLocalForge, localForgeBuild } from "./local-forge.js";

const port = process.env.PORT || 3000;
const build = "OX-013A";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.join(__dirname, "index.html");
const indexHtml = fs.readFileSync(indexPath, "utf8");

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow, noarchive"
  });
  res.end(JSON.stringify(body, null, 2));
}

function text(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow, noarchive"
  });
  res.end(body);
}

function html(res, status, body) {
  res.writeHead(status, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow, noarchive"
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/robots.txt") return text(res, 200, "User-agent: *\nDisallow: /\n");
    if (url.pathname === "/sitemap.xml") return text(res, 404, "No sitemap here. ox.oddsxray.com is the hidden runtime, not the public site.\n");

    if (url.pathname === "/health") {
      return json(res, 200, {
        ok: true,
        app: "Odds X-Ray",
        layer: "The Ox",
        build,
        status: "online",
        role: "hidden-runtime",
        architecture: "single-runtime-hyperlift-for-ox-only",
        forge_runtime: "inside-ox",
        forge_build: localForgeBuild,
        public_site: "separate-deployment",
        noindex: true,
        packages: "/api/packages"
      });
    }

    if (url.pathname === "/api/packages") {
      return json(res, 200, {
        ok: true,
        ox: { app: "Odds X-Ray", layer: "The Ox", build, status: "online", role: "hidden-runtime" },
        forge: {
          ok: true,
          layer: "The Forge",
          build: localForgeBuild,
          status: "online",
          runtime: "inside-ox",
          active_scenario: "s01-the-180-window",
          game_mode: "template_locked_tracked_evidence"
        },
        deploy: { mode: "ox-hyperlift-only", manual_commands_required: false, note: "This Hyperlift app is only the Ox/runtime surface. The public oddsxray.com website remains a separate deployment." },
        seo: { ox_noindex: true, public_site_location: "separate deployment, not this Hyperlift app" }
      });
    }

    if (url.pathname === "/f" || url.pathname === "/forgeup" || url.pathname === "/forge-current.sh" || url.pathname === "/forge-selfpull-install.sh") return text(res, 410, "Deprecated. Forge now runs inside Ox. Do not use curl installers.\n");

    if (url.pathname.startsWith("/api/forge/")) {
      const localPath = url.pathname.replace(/^\/api\/forge/, "/api");
      return await handleLocalForge(req, res, localPath);
    }

    if (url.pathname === "/api/deploy-target") return json(res, 200, { ok: true, ox_build: build, forge_build: localForgeBuild, deploy_mode: "ox-hyperlift-only", public_site: "separate-deployment", manual_commands_required: false });

    if (url.pathname === "/" || url.pathname === "/app" || url.pathname.startsWith("/app/")) return html(res, 200, indexHtml);

    return json(res, 404, { ok: false, error: "Route not found on Ox runtime", build });
  } catch (error) {
    return json(res, 500, { ok: false, error: "Ox runtime error", detail: error?.message || String(error), build });
  }
});

server.listen(port, "0.0.0.0", () => console.log(`The Ox ${build} running as hidden runtime on port ${port}; local Forge ${localForgeBuild}.`));

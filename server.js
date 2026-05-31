import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleLocalForge, localForgeBuild } from "./local-forge.js";

const port = process.env.PORT || 3000;
const build = "OX-012A";
const publicDomain = "https://oddsxray.com";
const appDomain = "https://ox.oddsxray.com";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.join(__dirname, "index.html");

function isOxHost(req) {
  const host = String(req.headers.host || "").toLowerCase();
  return host.startsWith("ox.") || host.includes("hyperlift") || host.includes("namecheapcloud");
}

function baseHeaders(req, type) {
  const headers = { "content-type": type, "cache-control": "no-store" };
  if (isOxHost(req)) headers["x-robots-tag"] = "noindex, nofollow, noarchive";
  return headers;
}

function json(req, res, status, body) {
  res.writeHead(status, baseHeaders(req, "application/json; charset=utf-8"));
  res.end(JSON.stringify(body, null, 2));
}

function text(req, res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, baseHeaders(req, type));
  res.end(body);
}

function html(req, res, body) {
  res.writeHead(200, baseHeaders(req, "text/html; charset=utf-8"));
  res.end(body);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
}

const pages = {
  "/": {
    title: "Odds X-Ray | Prediction Market Training Before the First Real Loss",
    desc: "Odds X-Ray helps prediction-market beginners practice contract reading, source checking, liquidity awareness, and exit discipline before real money is at risk.",
    eyebrow: "Prediction-market training",
    h1: "Practice the mistake before the market charges you for it.",
    lead: "Odds X-Ray is a training system for prediction-market users. The first product, Second Stake, puts users inside controlled first-loss simulations where they learn to read rules, check official sources, respect liquidity, and exit before a trade becomes a rescue mission.",
    primary: ["Start Second Stake", `${appDomain}/app/second-stake`],
    secondary: ["How it works", "/how-it-works"]
  },
  "/second-stake": {
    title: "Second Stake | First-Loss Prediction Market Simulator by Odds X-Ray",
    desc: "Second Stake is a browser-based prediction-market simulator that teaches users to avoid common first-loss mistakes.",
    eyebrow: "Product 001",
    h1: "Second Stake is first-loss training by fire.",
    lead: "The user sees a green exit, social confidence, thin depth, and an unresolved source. Every decision creates a trail. The autopsy shows what they inspected, what they ignored, and which mistake pattern they repeated.",
    primary: ["Run The $180 Window", `${appDomain}/app/second-stake/scenarios/s01-the-180-window`],
    secondary: ["Scenario library", "/scenarios"]
  },
  "/how-it-works": {
    title: "How Odds X-Ray Works | Evidence-Based Prediction Market Simulations",
    desc: "Learn how Odds X-Ray uses scenario simulation, evidence inspection, decision trails, and behavioral autopsies to train prediction-market discipline.",
    eyebrow: "Method",
    h1: "A market lesson needs pressure, not a lecture.",
    lead: "Odds X-Ray scenarios combine a market cockpit, evidence board, decision tree, delayed consequences, and final autopsy. The point is not to quiz the user. The point is to make them feel the pressure that causes bad market decisions, then show them exactly where the process broke.",
    primary: ["Try the first case", `${appDomain}/app/second-stake/scenarios/s01-the-180-window`],
    secondary: ["Read about Second Stake", "/second-stake"]
  },
  "/prediction-market-training": {
    title: "Prediction Market Training | Learn Rules, Sources, Liquidity, and Exits",
    desc: "A practical training approach for prediction-market users learning contract rules, official sources, order-book depth, liquidity, and cash-out discipline.",
    eyebrow: "Training category",
    h1: "Prediction markets punish process gaps.",
    lead: "Most beginner losses are not caused by a lack of excitement. They come from treating headlines as rules, comments as sources, displayed prices as exits, and old highs as current money. Odds X-Ray trains those failure modes directly.",
    primary: ["Start the simulator", `${appDomain}/app/second-stake`],
    secondary: ["Open glossary", "/glossary"]
  },
  "/scenarios": {
    title: "Scenario Library | Odds X-Ray Prediction Market Simulations",
    desc: "Explore Odds X-Ray scenario types, including The $180 Window, Headline Poison, and Liquidity Mirage.",
    eyebrow: "Scenario library",
    h1: "Each scenario trains a different failure mode.",
    lead: "The $180 Window trains exit discipline. Headline Poison will train contract-definition discipline. Liquidity Mirage will train the difference between a displayed price and a fillable exit.",
    primary: ["Play Scenario 01", `${appDomain}/app/second-stake/scenarios/s01-the-180-window`],
    secondary: ["Second Stake", "/second-stake"]
  },
  "/glossary": {
    title: "Prediction Market Glossary | Odds X-Ray",
    desc: "Definitions for cash-out, order book, liquidity, contract rules, resolver, source, settlement, and common prediction-market risk terms.",
    eyebrow: "Glossary",
    h1: "Terms that decide whether the trade is real.",
    lead: "Odds X-Ray focuses on the terms that change outcomes: contract rules, official sources, order-book depth, liquidity, settlement triggers, cash-out estimates, and exit discipline.",
    primary: ["Try the simulator", `${appDomain}/app/second-stake`],
    secondary: ["Prediction market training", "/prediction-market-training"]
  }
};

function publicPage(pathname) {
  const page = pages[pathname] || pages["/"];
  const canonical = `${publicDomain}${pathname === "/" ? "" : pathname}`;
  const cards = [
    ["Contract rules", "The exact wording decides what pays. A true headline can still fail the market."],
    ["Official source", "The named resolver/source matters more than comments, screenshots, or confidence."],
    ["Liquidity", "A displayed value is not the same as a fillable exit."],
    ["Exit discipline", "The old high is not current money. The available door can close."],
    ["Decision trail", "Each run records choices, inspected evidence, and missed evidence."],
    ["Autopsy", "The ending names the failure pattern so the user can recognize it next time."]
  ];
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Odds X-Ray",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: publicDomain,
    description: pages["/"].desc,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escapeHtml(page.title)}</title>
<meta name="description" content="${escapeHtml(page.desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${escapeHtml(page.title)}">
<meta property="og:description" content="${escapeHtml(page.desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<style>
:root{color-scheme:dark;--bg:#050609;--ink:#f7f0d8;--muted:rgba(247,240,216,.70);--line:rgba(255,255,255,.14);--card:#11141b;--red:#f0332f;--yellow:#ffdf59;--green:#25d366;--blue:#3482ff}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 8% 0,rgba(240,51,47,.25),transparent 34%),radial-gradient(circle at 92% 0,rgba(52,130,255,.21),transparent 32%),linear-gradient(180deg,#07080c,#050609 70%);color:var(--ink);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}a{color:inherit;text-decoration:none}.wrap{width:min(1120px,calc(100% - 28px));margin:auto;padding:18px 0 44px}.top{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:18px}.brand{display:flex;gap:12px;align-items:center}.mark{width:50px;height:50px;border-radius:15px;background:linear-gradient(135deg,#fff4bd 0 48%,var(--red) 49%);display:grid;place-items:center;color:#050609;font-weight:1000}.brand small{display:block;color:var(--muted)}.nav{display:flex;gap:8px;flex-wrap:wrap}.nav a,.btn{border:1px solid var(--line);border-radius:999px;padding:11px 14px;background:rgba(255,255,255,.05);font-weight:850}.btn.primary{background:var(--yellow);color:#050609;border-color:rgba(255,223,89,.9)}.hero,.panel,.card{border:1px solid var(--line);border-radius:30px;background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.025)),var(--card);box-shadow:0 24px 80px rgba(0,0,0,.48)}.hero{padding:clamp(24px,6vw,64px)}.stripe{height:14px;border-radius:999px;background:linear-gradient(90deg,var(--red) 0 22%,var(--yellow) 22% 50%,var(--green) 50% 72%,var(--blue) 72%);margin-bottom:24px}.eyebrow{color:var(--yellow);text-transform:uppercase;letter-spacing:.17em;font-size:12px;font-weight:950}.hero h1{font-size:clamp(48px,10vw,112px);line-height:.84;letter-spacing:-.08em;margin:10px 0 22px;max-width:900px}.lead{font-size:clamp(19px,3vw,30px);line-height:1.23;color:var(--muted);max-width:880px}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:16px}.card{padding:20px}.card small{display:block;color:var(--yellow);text-transform:uppercase;letter-spacing:.13em;font-size:11px;font-weight:950}.card h2{font-size:25px;margin:8px 0}.card p,.panel p{color:var(--muted);line-height:1.5}.panel{margin-top:16px;padding:clamp(20px,4vw,38px)}.panel h2{font-size:clamp(30px,5vw,54px);line-height:.95;letter-spacing:-.04em;margin:0 0 12px}.steps{counter-reset:step}.step{counter-increment:step;border-top:1px solid var(--line);padding:16px 0;color:var(--muted)}.step:before{content:counter(step);display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;background:rgba(255,223,89,.12);border:1px solid rgba(255,223,89,.35);color:var(--yellow);font-weight:900;margin-right:10px}footer{display:flex;justify-content:space-between;gap:12px;color:rgba(247,240,216,.42);font-size:13px;padding:18px 4px}@media(max-width:760px){.wrap{width:100%;padding:10px 8px 34px}.nav{display:none}.hero,.panel{border-radius:23px;padding:20px}.hero h1{font-size:54px}.lead{font-size:20px}.grid{grid-template-columns:1fr}footer{display:block}}
</style>
</head>
<body>
<main class="wrap">
<header class="top"><a class="brand" href="/"><span class="mark">OX</span><div><b>Odds X-Ray</b><small>Prediction-market training</small></div></a><nav class="nav"><a href="/second-stake">Second Stake</a><a href="/how-it-works">How it works</a><a href="/scenarios">Scenarios</a><a href="/glossary">Glossary</a></nav></header>
<section class="hero"><div class="stripe"></div><p class="eyebrow">${escapeHtml(page.eyebrow)}</p><h1>${escapeHtml(page.h1)}</h1><p class="lead">${escapeHtml(page.lead)}</p><div class="actions"><a class="btn primary" href="${escapeHtml(page.primary[1])}">${escapeHtml(page.primary[0])}</a><a class="btn" href="${escapeHtml(page.secondary[1])}">${escapeHtml(page.secondary[0])}</a></div></section>
<section class="grid">${cards.map(([h, p]) => `<article class="card"><small>Training focus</small><h2>${escapeHtml(h)}</h2><p>${escapeHtml(p)}</p></article>`).join("")}</section>
<section class="panel"><h2>How the first product works</h2><div class="steps"><div class="step">The user enters a market scenario with a visible exit, incomplete evidence, and time pressure.</div><div class="step">The user chooses whether to inspect evidence, act, wait, size up, or leave.</div><div class="step">The system records decisions, inspected evidence, missed evidence, and delayed consequences.</div><div class="step">The final autopsy names the pattern: rule skipper, window ghost, liquidity realist, disciplined pass, or process winner.</div></div></section>
<footer><span>© ${new Date().getFullYear()} Odds X-Ray</span><span>Public site: oddsxray.com · Product runtime: ox.oddsxray.com</span></footer>
</main>
</body>
</html>`;
}

function sitemapXml() {
  const urls = ["/", "/second-stake", "/how-it-works", "/prediction-market-training", "/scenarios", "/glossary"];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${publicDomain}${u === "/" ? "" : u}</loc><changefreq>weekly</changefreq><priority>${u === "/" ? "1.0" : "0.8"}</priority></url>`).join("\n")}\n</urlset>\n`;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/robots.txt") {
      if (isOxHost(req)) return text(req, res, 200, "User-agent: *\nDisallow: /\n");
      return text(req, res, 200, `User-agent: *\nAllow: /\nSitemap: ${publicDomain}/sitemap.xml\n`);
    }

    if (url.pathname === "/sitemap.xml") return text(req, res, 200, sitemapXml(), "application/xml; charset=utf-8");

    if (url.pathname === "/health") {
      return json(req, res, 200, { ok: true, app: "Odds X-Ray", layer: "The Ox", build, status: "online", architecture: "single-runtime", forge_runtime: "inside-ox", forge_build: localForgeBuild, public_homepage: publicDomain, app_home: appDomain, packages: "/api/packages" });
    }

    if (url.pathname === "/api/packages") {
      return json(req, res, 200, { ok: true, ox: { app: "Odds X-Ray", layer: "The Ox", build, status: "online" }, forge: { ok: true, layer: "The Forge", build: localForgeBuild, status: "online", runtime: "inside-ox", active_scenario: "s01-the-180-window", game_mode: "single_runtime_tracked_evidence" }, expected: { ox_build: build, forge_build: localForgeBuild }, deploy: { mode: "single-runtime-hyperlift", manual_commands_required: false }, seo: { public_domain: publicDomain, ox_noindex: true, sitemap: `${publicDomain}/sitemap.xml` } });
    }

    if (url.pathname === "/f" || url.pathname === "/forgeup" || url.pathname === "/forge-current.sh" || url.pathname === "/forge-selfpull-install.sh") return text(req, res, 410, "Deprecated. Forge now runs inside Ox. Product deploys happen through the normal Ox Hyperlift deploy.\n");

    if (url.pathname.startsWith("/api/forge/")) {
      const localPath = url.pathname.replace(/^\/api\/forge/, "/api");
      return handleLocalForge(req, res, localPath);
    }

    if (url.pathname === "/api/deploy-target") return json(req, res, 200, { ok: true, ox_build: build, forge_build: localForgeBuild, deploy_mode: "single-runtime-hyperlift", manual_commands_required: false });

    if (pages[url.pathname] && !isOxHost(req)) return html(req, res, publicPage(url.pathname));

    if (pages[url.pathname] && isOxHost(req)) return html(req, res, publicPage(url.pathname));

    if (url.pathname === "/" && isOxHost(req)) return html(req, res, fs.readFileSync(indexPath, "utf8"));

    if (url.pathname === "/app" || url.pathname.startsWith("/app/")) return html(req, res, fs.readFileSync(indexPath, "utf8"));

    return json(req, res, 404, { ok: false, error: "Route not found", build });
  } catch (error) {
    return json(req, res, 500, { ok: false, error: "Ox runtime error", detail: error?.message || String(error), build });
  }
});

server.listen(port, "0.0.0.0", () => console.log(`The Ox ${build} running on port ${port}; public homepage prepared for ${publicDomain}; local Forge ${localForgeBuild}.`));

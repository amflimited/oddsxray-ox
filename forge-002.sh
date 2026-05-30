#!/usr/bin/env bash
set -e

BUILD="FORGE-002"
APP_DIR="/opt/oddsxray-forge"

export DEBIAN_FRONTEND=noninteractive

apt update
apt install -y curl nginx nodejs npm

mkdir -p "$APP_DIR/data"
cd "$APP_DIR"

if [ ! -f data/scenarios.json ]; then
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
fi

if [ ! -f data/attempts.json ]; then
  echo '[]' > data/attempts.json
fi

cat > package.json <<'JSON'
{
  "name": "oddsxray-forge",
  "version": "0.0.2",
  "type": "module",
  "scripts": { "start": "node server.js" }
}
JSON

cat > server.js <<'JS'
import http from "node:http";
import fs from "node:fs";
import crypto from "node:crypto";

const PORT = process.env.PORT || 3001;
const BUILD = "FORGE-002";
const SCENARIO_PATH = "./data/scenarios.json";
const ATTEMPT_PATH = "./data/attempts.json";

function readJson(path, fallback) {
  try { return JSON.parse(fs.readFileSync(path, "utf8")); }
  catch { return fallback; }
}
function writeJson(path, value) {
  fs.writeFileSync(path, JSON.stringify(value, null, 2));
}
function scenarios() { return readJson(SCENARIO_PATH, []); }
function attempts() { return readJson(ATTEMPT_PATH, []); }
function nodeMap(scenario) { return Object.fromEntries((scenario.nodes || []).map(n => [n.id, n])); }
function findScenario(id) { return scenarios().find(s => s.id === id); }
function findChoice(node, choiceId) { return (node?.choices || []).find(c => c.id === choiceId); }
function now() { return new Date().toISOString(); }
function id(prefix) { return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`; }

function send(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  res.end(JSON.stringify(body, null, 2));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => {
      if (!data.trim()) return resolve({});
      try { resolve(JSON.parse(data)); }
      catch { resolve({ _invalid_json: true, raw: data }); }
    });
  });
}

function summarizeAttempt(attempt) {
  return {
    attempt_id: attempt.attempt_id,
    scenario_id: attempt.scenario_id,
    status: attempt.status,
    started_at: attempt.started_at,
    completed_at: attempt.completed_at || null,
    scar_unlocked: attempt.scar_unlocked || null,
    choices_count: attempt.choices.length,
    last_node_id: attempt.current_node_id
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "OPTIONS") return send(res, 204, {});

  if (url.pathname === "/health") {
    return send(res, 200, { ok: true, app: "Odds X-Ray", layer: "The Forge", build: BUILD, status: "online" });
  }

  if (req.method === "GET" && url.pathname === "/api/scenarios") {
    return send(res, 200, { ok: true, build: BUILD, scenarios: scenarios().map(s => ({ id: s.id, module: s.module, title: s.title, scar: s.scar, status: s.status })) });
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/scenarios/")) {
    const scenario = findScenario(url.pathname.split("/").pop());
    if (!scenario) return send(res, 404, { ok: false, error: "Scenario not found", build: BUILD });
    return send(res, 200, { ok: true, build: BUILD, scenario });
  }

  if (req.method === "POST" && url.pathname === "/api/attempts") {
    const body = await readBody(req);
    const scenarioId = body.scenario_id || "green-number-trap";
    const scenario = findScenario(scenarioId);
    if (!scenario) return send(res, 404, { ok: false, error: "Scenario not found", build: BUILD });
    const maps = nodeMap(scenario);
    const startNode = maps.start || (scenario.nodes || [])[0];
    const attempt = {
      attempt_id: id("att"),
      scenario_id: scenario.id,
      module: scenario.module,
      status: "in_progress",
      started_at: now(),
      completed_at: null,
      current_node_id: startNode?.id || "start",
      choices: [],
      outcome: null,
      scar_unlocked: null
    };
    const all = attempts();
    all.unshift(attempt);
    writeJson(ATTEMPT_PATH, all);
    return send(res, 201, { ok: true, build: BUILD, attempt, node: startNode, scenario_summary: { id: scenario.id, title: scenario.title, scar: scenario.scar } });
  }

  if (req.method === "POST" && url.pathname.match(/^\/api\/attempts\/[^/]+\/choice$/)) {
    const body = await readBody(req);
    const attemptId = url.pathname.split("/")[3];
    const all = attempts();
    const attempt = all.find(a => a.attempt_id === attemptId);
    if (!attempt) return send(res, 404, { ok: false, error: "Attempt not found", build: BUILD });
    if (attempt.status === "complete") return send(res, 409, { ok: false, error: "Attempt already complete", build: BUILD, attempt });

    const scenario = findScenario(attempt.scenario_id);
    if (!scenario) return send(res, 404, { ok: false, error: "Scenario not found", build: BUILD });
    const maps = nodeMap(scenario);
    const currentNode = maps[body.node_id || attempt.current_node_id];
    if (!currentNode) return send(res, 400, { ok: false, error: "Current node not found", build: BUILD });
    const choice = findChoice(currentNode, body.choice_id);
    if (!choice) return send(res, 400, { ok: false, error: "Choice not valid for current node", build: BUILD });
    const nextNode = maps[choice.next];
    if (!nextNode) return send(res, 400, { ok: false, error: "Next node not found", build: BUILD });

    const choiceRecord = {
      at: now(),
      node_id: currentNode.id,
      choice_id: choice.id,
      label: choice.label,
      next_node_id: choice.next
    };
    attempt.choices.push(choiceRecord);
    attempt.current_node_id = nextNode.id;

    const terminal = !nextNode.choices || nextNode.choices.length === 0;
    if (terminal) {
      attempt.status = "complete";
      attempt.completed_at = now();
      attempt.outcome = {
        node_id: nextNode.id,
        result: nextNode.result || null,
        diagnosis: nextNode.diagnosis || null,
        scar: nextNode.scar || scenario.scar
      };
      attempt.scar_unlocked = attempt.outcome.scar;
    }

    writeJson(ATTEMPT_PATH, all);
    return send(res, 200, { ok: true, build: BUILD, attempt, choice: choiceRecord, node: nextNode, complete: terminal, scar_unlocked: attempt.scar_unlocked });
  }

  if (req.method === "GET" && url.pathname === "/api/attempts") {
    return send(res, 200, { ok: true, build: BUILD, attempts: attempts().map(summarizeAttempt).slice(0, 50) });
  }

  if (req.method === "GET" && url.pathname.match(/^\/api\/attempts\/[^/]+$/)) {
    const attemptId = url.pathname.split("/").pop();
    const attempt = attempts().find(a => a.attempt_id === attemptId);
    if (!attempt) return send(res, 404, { ok: false, error: "Attempt not found", build: BUILD });
    return send(res, 200, { ok: true, build: BUILD, attempt });
  }

  if (req.method === "GET" && url.pathname === "/api/progress") {
    const all = attempts();
    const complete = all.filter(a => a.status === "complete");
    const scars = [...new Set(complete.map(a => a.scar_unlocked).filter(Boolean))];
    return send(res, 200, { ok: true, build: BUILD, progress: { total_attempts: all.length, completed_attempts: complete.length, scars_unlocked: scars.length, scars } });
  }

  return send(res, 404, { ok: false, error: "Route not found", build: BUILD });
});

server.listen(PORT, "127.0.0.1", () => console.log(`The Forge ${BUILD} running on ${PORT}`));
JS

systemctl daemon-reload
systemctl restart oddsxray-forge
systemctl status oddsxray-forge --no-pager || true
curl -s http://127.0.0.1:3001/health

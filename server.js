import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.join(__dirname, "index.html");

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
};

const html = (res, status, body) => {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
  res.end(body);
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/health") {
    return json(res, 200, {
      ok: true,
      app: "Odds X-Ray",
      layer: "The Ox",
      build: "OX-001C",
      status: "online"
    });
  }

  if (url.pathname === "/app" || url.pathname === "/app/" || url.pathname === "/app/products" || url.pathname === "/app/second-stake" || url.pathname === "/app/second-stake/scenarios/green-number-trap" || url.pathname === "/") {
    const page = fs.readFileSync(indexPath, "utf8");
    return html(res, 200, page);
  }

  return json(res, 404, { ok: false, error: "Route not found", build: "OX-001C" });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`The Ox running on port ${port}`);
});

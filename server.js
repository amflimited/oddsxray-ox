import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

app.use(express.static(distPath));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    app: "Odds X-Ray",
    layer: "The Ox",
    build: process.env.VITE_BUILD_ID || "OX-001"
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`The Ox running on port ${port}`);
});
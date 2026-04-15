import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";

const port = Number(process.env.PORT || 4173);
const root = process.cwd();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function safePath(urlPath) {
  const clean = normalize(urlPath).replace(/^([.][.][/\\])+/, "");
  return join(root, clean);
}

function sendFile(path, res) {
  const ext = extname(path).toLowerCase();
  res.setHeader("Content-Type", contentTypes[ext] || "application/octet-stream");
  createReadStream(path).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (url.pathname === "/runtime-config.js") {
    const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3000/api/v1";
    res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
    res.end(`window.__APP_CONFIG__ = { API_BASE_URL: ${JSON.stringify(apiBaseUrl)} };`);
    return;
  }

  const target = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const filePath = safePath(target);

  if (existsSync(filePath)) {
    sendFile(filePath, res);
    return;
  }

  if (existsSync(safePath("index.html")) && !extname(filePath)) {
    sendFile(safePath("index.html"), res);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
}).listen(port, () => {
  console.log(`Frontend running on :${port}`);
});

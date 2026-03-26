import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 8010;
const execFileAsync = promisify(execFile);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
};

const getContentType = (filePath) => MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";

const safeResolve = (requestPath) => {
  const normalizedPath = decodeURIComponent(requestPath.split("?")[0]);
  const candidatePath = normalizedPath === "/" ? "/index.html" : normalizedPath;
  const resolvedPath = path.resolve(__dirname, `.${candidatePath}`);
  if (!resolvedPath.startsWith(__dirname)) {
    return null;
  }
  return resolvedPath;
};

const readRequestBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
};

const proxyPttPostalCode = async (request, response) => {
  try {
    const rawBody = await readRequestBody(request);
    const payload = JSON.parse(rawBody || "{}");
    const { stdout } = await execFileAsync("curl", [
      "-L",
      "--fail",
      "-s",
      "https://www.ptt.gov.tr/api/posta-kodu",
      "-H",
      "Content-Type: application/json",
      "--data",
      JSON.stringify(payload),
    ]);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end(stdout);
  } catch (error) {
    sendJson(response, 500, {
      error: "PTT posta kodu servisine bağlanılamadı.",
      detail: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
};

const serveStatic = async (request, response) => {
  const resolvedPath = safeResolve(request.url || "/");
  if (!resolvedPath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(resolvedPath);
    response.writeHead(200, {
      "Content-Type": getContentType(resolvedPath),
      "Cache-Control": resolvedPath.endsWith(".html") ? "no-cache" : "public, max-age=300",
    });
    response.end(file);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not Found");
  }
};

const server = createServer(async (request, response) => {
  if (request.method === "POST" && request.url === "/api/ptt-posta-kodu") {
    await proxyPttPostalCode(request, response);
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Method Not Allowed");
    return;
  }

  await serveStatic(request, response);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Server ready at http://127.0.0.1:${PORT}`);
});

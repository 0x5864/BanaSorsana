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

const proxyTranslate = async (request, response) => {
  try {
    const rawBody = await readRequestBody(request);
    const payload = JSON.parse(rawBody || "{}");
    const text = typeof payload.text === "string" ? payload.text.trim() : "";
    const source = typeof payload.source === "string" && payload.source ? payload.source : "auto";
    const target = typeof payload.target === "string" && payload.target ? payload.target : "en";

    if (!text) {
      sendJson(response, 400, {
        error: "Çevrilecek metin boş olamaz.",
      });
      return;
    }

    const params = new URLSearchParams();
    params.set("client", "gtx");
    params.set("sl", source);
    params.set("tl", target);
    params.append("dt", "t");
    params.append("dt", "rm");
    params.set("q", text);

    const { stdout } = await execFileAsync("curl", [
      "-L",
      "--fail",
      "-s",
      `https://translate.googleapis.com/translate_a/single?${params.toString()}`,
    ]);

    const data = JSON.parse(stdout);
    const chunks = Array.isArray(data?.[0]) ? data[0] : [];
    const translation = chunks
      .map((chunk) => (Array.isArray(chunk) ? chunk[0] ?? "" : ""))
      .join("")
      .trim();
    const transliteration = chunks
      .map((chunk) => {
        if (!Array.isArray(chunk)) {
          return "";
        }
        return typeof chunk[2] === "string" ? chunk[2] : "";
      })
      .join(" ")
      .trim();
    const detectedSource = typeof data?.[2] === "string" && data[2] ? data[2] : source;

    sendJson(response, 200, {
      translation,
      transliteration,
      detectedSource,
    });
  } catch (error) {
    sendJson(response, 500, {
      error: "Çeviri servisine bağlanılamadı.",
      detail: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
};

const parseNumericValue = (value) => Number(String(value).replace(/,/g, "").trim());

const escapePattern = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractCnbceRow = (html, title) => {
  const pattern = new RegExp(
    `title="${escapePattern(title)}"[\\s\\S]*?<td class="num-data">([^<]+)</td>\\s*<td class="num-data">([^<]+)</td>`,
    "i",
  );
  const match = html.match(pattern);
  if (!match) {
    return null;
  }

  return {
    buy: parseNumericValue(match[1]),
    sell: parseNumericValue(match[2]),
  };
};

const proxyGoldRates = async (_request, response) => {
  try {
    const { stdout } = await execFileAsync("curl", [
      "-L",
      "--fail",
      "-s",
      "https://www.cnbce.com/altin/gram-altin-serbest-piyasa-gram-tl",
    ]);

    const ons = extractCnbceRow(stdout, "ALTIN/ONS ($)");
    const hasGram = extractCnbceRow(stdout, "HAS ALTIN GRAM (TL)");
    const gram18 = extractCnbceRow(stdout, "18 AYAR BİLEZİK (TL)");
    const ceyrek = extractCnbceRow(stdout, "ÇEYREK ALTIN (TL)");
    const ata = extractCnbceRow(stdout, "ATA ALTIN (TL)");
    const gremse = extractCnbceRow(stdout, "GREMSE ALTIN (TL)");

    if (!ons || !hasGram || !gram18 || !ceyrek || !ata || !gremse) {
      throw new Error("Fiyat satırları eksik geldi.");
    }

    const buildDerivedRate = (baseRate, multiplier) => ({
      buy: baseRate.buy * multiplier,
      sell: baseRate.sell * multiplier,
      derived: true,
    });

    sendJson(response, 200, {
      source: "CNBC-E altın tablosu",
      rates: {
        gram24: { ...hasGram, unit: "gram" },
        gram22: { ...buildDerivedRate(hasGram, 22 / 24), unit: "gram", derived: true },
        gram18: { ...gram18, unit: "gram" },
        ceyrek: { ...ceyrek, unit: "adet" },
        yarim: { ...buildDerivedRate(ceyrek, 2), unit: "adet" },
        tam: { ...buildDerivedRate(ceyrek, 4), unit: "adet" },
        ata: { ...ata, unit: "adet" },
        gremse: { ...gremse, unit: "adet" },
        hasGram: { ...hasGram, unit: "gram" },
        ons: { ...ons, unit: "ons" },
      },
    });
  } catch (error) {
    sendJson(response, 500, {
      error: "Altın fiyatları alınamadı.",
      detail: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
};

const parseHakedisIndexTable = (html) => {
  const rowRegex = /<tr><td>(\d{4})<\/td>([\s\S]*?)<\/tr>/g;
  const cellRegex = /<td>(.*?)<\/td>/g;
  const indexMap = {};
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const year = rowMatch[1];
    const cells = [];
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowMatch[2])) !== null) {
      const normalized = cellMatch[1]
        .replace(/<br\s*\/?>/gi, "")
        .replace(/&nbsp;/gi, "")
        .trim();
      cells.push(normalized);
    }

    cells.forEach((rawValue, index) => {
      if (!rawValue) {
        return;
      }
      const month = String(index + 1).padStart(2, "0");
      indexMap[`${year}-${month}`] = Number(rawValue.replace(/\./g, "").replace(",", "."));
    });
  }

  return indexMap;
};

const ENAG_MONTHLY_RATES = {
  "2025-01": 8.22,
  "2025-02": 3.37,
  "2025-03": 3.91,
  "2025-04": 4.46,
  "2025-05": 3.66,
  "2025-06": 3.05,
  "2025-07": 3.75,
  "2025-08": 3.23,
  "2025-09": 3.79,
  "2025-10": 3.74,
  "2025-11": 2.13,
  "2025-12": 2.11,
  "2026-01": 6.32,
  "2026-02": 4.01,
};

const buildIndexSeries = (baseKey, monthlyRates) => {
  const keys = Object.keys(monthlyRates).sort();
  const indexMap = { [baseKey]: 100 };
  let previousValue = 100;

  keys.forEach((key) => {
    previousValue *= 1 + (monthlyRates[key] / 100);
    indexMap[key] = Number(previousValue.toFixed(6));
  });

  return indexMap;
};

const proxyInflationIndices = async (_request, response) => {
  try {
    const cpiResponse = await execFileAsync("curl", [
      "-L",
      "--fail",
      "-s",
      "https://www.hakedis.org/endeksler/tuketici-fiyat-genel-endeksi-ve-degisim-oranlari-2003",
    ]);

    const cpi = parseHakedisIndexTable(cpiResponse.stdout);
    const enag = buildIndexSeries("2024-12", ENAG_MONTHLY_RATES);

    sendJson(response, 200, {
      source: "Hakedis TÜFE tablosu ve ENAG aylık E-TÜFE bültenleri",
      indices: {
        cpi,
        enag,
      },
      coverage: {
        enagStart: "2024-12",
        enagEnd: "2026-02",
      },
    });
  } catch (error) {
    sendJson(response, 500, {
      error: "Enflasyon endeksleri alınamadı.",
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

  if (request.method === "POST" && request.url === "/api/translate") {
    await proxyTranslate(request, response);
    return;
  }

  if (request.method === "GET" && request.url === "/api/gold-rates") {
    await proxyGoldRates(request, response);
    return;
  }

  if (request.method === "GET" && request.url === "/api/inflation-indices") {
    await proxyInflationIndices(request, response);
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

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const IDS_DIR = path.join(__dirname, "employee-ids");
const SECRET_ROUTE = "/secret-dunder-admin";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

fs.mkdirSync(IDS_DIR, { recursive: true });

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data), {
    "Content-Type": "application/json; charset=utf-8"
  });
}

function safeName(value) {
  const cleaned = String(value || "employee")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return cleaned || "employee";
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 15_000_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    send(res, 403, "Forbidden", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }

    const type = MIME_TYPES[path.extname(filePath)] || "application/octet-stream";
    send(res, 200, content, { "Content-Type": type });
  });
}

function listIds() {
  return fs
    .readdirSync(IDS_DIR)
    .filter((file) => file.endsWith(".png"))
    .sort((a, b) => b.localeCompare(a))
    .map((file) => {
      const fullPath = path.join(IDS_DIR, file);
      const stats = fs.statSync(fullPath);
      return {
        file,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        href: `/employee-ids/${encodeURIComponent(file)}`
      };
    });
}

function crc32(buffer) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = Array.from({ length: 256 }, (_, index) => {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }
      return value >>> 0;
    });
  }

  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name);
    const data = file.data;
    const checksum = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBuffer, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBuffer);

    offset += local.length + nameBuffer.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

async function saveId(req, res) {
  try {
    const payload = JSON.parse(await readBody(req));
    const name = String(payload.name || "").trim();
    const image = String(payload.image || "");

    if (!name) {
      sendJson(res, 400, { error: "Name is required." });
      return;
    }

    const match = image.match(/^data:image\/png;base64,([a-z0-9+/=]+)$/i);
    if (!match) {
      sendJson(res, 400, { error: "A PNG employee ID image is required." });
      return;
    }

    const base = safeName(name);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const id = crypto.randomBytes(3).toString("hex");
    const fileName = `${base}-${stamp}-${id}.png`;
    const filePath = path.join(IDS_DIR, fileName);

    fs.writeFileSync(filePath, Buffer.from(match[1], "base64"));
    sendJson(res, 201, { file: fileName, href: `/employee-ids/${encodeURIComponent(fileName)}` });
  } catch (error) {
    sendJson(res, error.message === "Payload too large" ? 413 : 500, {
      error: error.message === "Payload too large" ? error.message : "Could not save employee ID."
    });
  }
}

function serveSavedId(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const file = path.basename(decodeURIComponent(url.pathname.replace("/employee-ids/", "")));
  const filePath = path.join(IDS_DIR, file);

  if (!file.endsWith(".png") || !fs.existsSync(filePath)) {
    send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  send(res, 200, fs.readFileSync(filePath), {
    "Content-Type": "image/png",
    "Content-Disposition": `inline; filename="${file}"`
  });
}

function serveSecretPage(res) {
  const ids = listIds();
  const rows = ids
    .map(
      (id) => `<tr>
        <td><a href="${id.href}" target="_blank" rel="noreferrer">${id.file}</a></td>
        <td>${new Date(id.createdAt).toLocaleString()}</td>
        <td>${Math.round(id.size / 1024)} KB</td>
      </tr>`
    )
    .join("");

  send(
    res,
    200,
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dunder Mifflin ID Archive</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body class="admin-body">
  <main class="admin-shell">
    <div class="admin-heading">
      <div>
        <p>Dunder Mifflin Paper Company</p>
        <h1>Employee ID Archive</h1>
      </div>
      <a class="button primary" href="${SECRET_ROUTE}/download">Download all IDs</a>
    </div>
    <table>
      <thead><tr><th>File</th><th>Created</th><th>Size</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="3">No finalized employee IDs yet.</td></tr>`}</tbody>
    </table>
  </main>
</body>
</html>`,
    { "Content-Type": "text/html; charset=utf-8" }
  );
}

function downloadAll(res) {
  const files = listIds().map((id) => ({
    name: id.file,
    data: fs.readFileSync(path.join(IDS_DIR, id.file))
  }));
  const zip = createZip(files);

  send(res, 200, zip, {
    "Content-Type": "application/zip",
    "Content-Disposition": "attachment; filename=\"dunder-mifflin-employee-ids.zip\""
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "POST" && url.pathname === "/api/ids") {
    saveId(req, res);
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/employee-ids/")) {
    serveSavedId(req, res);
    return;
  }

  if (req.method === "GET" && url.pathname === SECRET_ROUTE) {
    serveSecretPage(res);
    return;
  }

  if (req.method === "GET" && url.pathname === `${SECRET_ROUTE}/download`) {
    downloadAll(res);
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  send(res, 405, "Method not allowed", { "Content-Type": "text/plain; charset=utf-8" });
});

server.listen(PORT, () => {
  console.log(`Dunder Mifflin ID maker running at http://localhost:${PORT}`);
  console.log(`Secret archive: http://localhost:${PORT}${SECRET_ROUTE}`);
});

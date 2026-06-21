const crypto = require("crypto");
const { readJson, safeName } = require("./_helpers");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const { put } = await import("@vercel/blob");
    const payload = await readJson(req);
    const name = String(payload.name || "").trim();
    const image = String(payload.image || "");

    if (!name) {
      res.status(400).json({ error: "Name is required." });
      return;
    }

    const match = image.match(/^data:image\/png;base64,([a-z0-9+/=]+)$/i);
    if (!match) {
      res.status(400).json({ error: "A PNG employee ID image is required." });
      return;
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const id = crypto.randomBytes(3).toString("hex");
    const fileName = `${safeName(name)}-${stamp}-${id}.png`;
    const pathname = `employee-ids/${fileName}`;
    const body = Buffer.from(match[1], "base64");
    const blob = await put(pathname, body, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/png"
    });

    res.status(201).json({
      file: fileName,
      href: blob.url,
      pathname: blob.pathname
    });
  } catch (error) {
    const status = error.message === "Payload too large" ? 413 : 500;
    res.status(status).json({
      error: status === 413 ? error.message : "Could not save employee ID."
    });
  }
};

const { blobFileName } = require("./_helpers");
const { createZip } = require("./_zip");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: "employee-ids/" });
    const files = [];

    for (const blob of blobs) {
      const response = await fetch(blob.url);
      if (!response.ok) continue;
      const data = Buffer.from(await response.arrayBuffer());
      files.push({ name: blobFileName(blob.pathname), data });
    }

    const zip = createZip(files);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=\"dunder-mifflin-employee-ids.zip\"");
    res.status(200).send(zip);
  } catch (error) {
    res.status(500).send("Could not download employee IDs.");
  }
};

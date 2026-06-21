const { blobFileName, formatDate } = require("./_helpers");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: "employee-ids/" });
    const sorted = blobs.sort((a, b) => {
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });
    const rows = sorted
      .map((blob) => {
        const file = blobFileName(blob.pathname);
        return `<tr>
          <td><a href="${blob.url}" target="_blank" rel="noreferrer">${file}</a></td>
          <td>${formatDate(blob.uploadedAt)}</td>
          <td>${Math.round((blob.size || 0) / 1024)} KB</td>
        </tr>`;
      })
      .join("");

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`<!doctype html>
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
        <p>Partyvorous Admin</p>
        <h1>Employee ID Archive</h1>
      </div>
      <a class="button primary" href="/secret-dunder-admin/download">Download all IDs</a>
    </div>
    <table>
      <thead><tr><th>File</th><th>Created</th><th>Size</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="3">No finalized employee IDs yet.</td></tr>`}</tbody>
    </table>
  </main>
</body>
</html>`);
  } catch (error) {
    res.status(500).send("Could not load employee ID archive.");
  }
};

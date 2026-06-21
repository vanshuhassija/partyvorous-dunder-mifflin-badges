# Partyvorous Dunder Mifflin Employee IDs

Create Dunder Mifflin-style employee IDs, save finalized PNGs, and download the saved archive from a secret admin route.

## Local Development

```bash
npm install
npm start
```

Open `http://localhost:3000`.

The local server saves PNGs in `employee-ids/`.

## Vercel Deployment

This project is Vercel-ready with static files in `public/` and serverless API routes in `api/`.

Before deploying, create a Vercel Blob store for the project so Vercel provides `BLOB_READ_WRITE_TOKEN`.

```bash
npm install -g vercel
vercel login
vercel
vercel --prod
```

Production routes:

- `/` - ID maker
- `/api/ids` - saves finalized PNGs to Vercel Blob
- `/secret-dunder-admin` - secret archive page
- `/secret-dunder-admin/download` - downloads all saved IDs as a ZIP


# Production deployment

The local development backend still uses `backend/data/database.json` when `DATABASE_URL` is absent or is not PostgreSQL. Production requires PostgreSQL and private S3-compatible resume storage. The SQLite file, JSON source data, and local uploads are not deleted or changed by the deployment setup.

## 1. Provision storage

Create a PostgreSQL database and a **private** S3-compatible bucket. Keep the connection string and object-storage credentials in your hosting provider's encrypted environment variables. Do not commit them or paste them into chat.

Required backend variables:

- `NODE_ENV=production`
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — random value, at least 32 characters
- `FRONTEND_ORIGIN` — exact public frontend origin, for example `https://job-portal-e5dk.vercel.app`
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `S3_REGION` — use the region required by your storage provider (`auto` for Cloudflare R2)

## 2. Deploy the backend on Vercel

Create a second Vercel project connected to this repository. Set **Root Directory** to `backend` and the framework to **Express**. The build script generates Prisma Client, applies committed migrations, and compiles TypeScript. Set the backend variables above for Production before deploying.

After deployment, check `https://<backend-domain>/api/health`. It returns `{"status":"ok", ...}` only when the database connection is available.

## 3. Preserve and import current JSON records

The JSON import command refuses to run if any target table already contains rows. It imports the existing records in one transaction and leaves `backend/data/database.json` untouched. Once the production database variables are configured locally in an ignored environment file, run:

```powershell
npm run prisma:import-json --workspace=backend
```

Do not run the demo seeder in production. Use the importer for existing accounts and records.

## 4. Connect the frontend

In the frontend Vercel project, set `BACKEND_API_URL` to the backend's origin (for example, `https://job-portal-api.example.vercel.app`) for Production, then redeploy the frontend. Leave `NEXT_PUBLIC_API_URL` unset so API requests stay same-origin through the Next.js rewrite. This avoids exposing storage or database credentials to the browser.

The backend streams resume files only after checking that the requester owns the student profile, is a company with an application from that student, or is an admin. Uploaded files are stored privately in the configured object bucket.

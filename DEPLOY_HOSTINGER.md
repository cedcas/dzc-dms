# Hostinger Deployment Guide — DZC DMS

## Prerequisites

| Requirement | Notes |
|---|---|
| Hostinger plan | Business or Cloud with Node.js web app support |
| Node.js version | **v20 LTS** (minimum). Confirm in hPanel under Node.js settings. |
| MySQL | Create a MySQL 8 database in hPanel before deploying. Host will be `localhost`. |

---

## Environment Variables

Set these in hPanel → Web App → Environment Variables (or `.env` on the server).

| Variable | Production value |
|---|---|
| `DATABASE_URL` | `mysql://DB_USER:DB_PASS@localhost:3306/DB_NAME` |
| `AUTH_SECRET` | Run `openssl rand -base64 32` locally and paste the output |
| `AUTH_URL` | `https://yourdomain.com` (no trailing slash) |
| `NODE_ENV` | `production` |
| `UPLOAD_DIR` | Absolute path to a **persistent** writable directory outside the app folder — e.g. `/home/u123456789/uploads` |

> **Do NOT set `SHADOW_DATABASE_URL` in production.** It is only used by `prisma migrate dev` locally. The `shadowDatabaseUrl` line in `schema.prisma` is harmless when the env var is absent in production.

---

## Build Command (hPanel → Web App → Build Command)

```bash
npm install && npx prisma generate && npm run build
```

- `npm install` — installs all dependencies (including `prisma` and `next`)
- `npx prisma generate` — generates the Prisma client from `schema.prisma`
- `npm run build` — runs `next build`

## Start Command (hPanel → Web App → Start Command)

```bash
npm start
```

Runs `next start` on the port Hostinger assigns (Next.js respects the `PORT` env var automatically).

---

## First-Deploy Steps (run once via SSH or hPanel terminal)

```bash
# 1. Apply all pending migrations to the production database
npx prisma migrate deploy

# 2. Seed the initial admin user
#    Creates: admin@dzc.internal / admin1234 (CHANGE IMMEDIATELY)
npx prisma db seed

# 3. Create and verify the uploads directory is writable
mkdir -p $UPLOAD_DIR
```

> Run these commands from the app's root directory on the server.

## Subsequent Deploys (after schema changes only)

```bash
npx prisma migrate deploy
```

No re-seeding required.

---

## File Upload Path

Documents are stored on disk at:

```
$UPLOAD_DIR/{clientId}/{docId}-{filename}
$UPLOAD_DIR/accounts/{debtAccountId}/{docId}-{filename}
```

The `storagePath` column in the `documents` table stores paths **relative to `UPLOAD_DIR`**, so the directory can be moved as long as `UPLOAD_DIR` is updated and the files move with it.

**Critical:** Set `UPLOAD_DIR` to a directory that survives redeployments (outside the app root). If left unset, the code falls back to `{cwd}/uploads`, which is inside the app directory and will be wiped on redeploy.

---

## Step-by-Step Deployment Checklist

### One-time setup
- [ ] Create MySQL 8 database in hPanel; note host, user, password, DB name
- [ ] Create a persistent uploads directory (e.g. `/home/u123456789/uploads`) and confirm it is writable
- [ ] Generate `AUTH_SECRET` locally: `openssl rand -base64 32`
- [ ] Push the repo to GitHub (or connect to Hostinger Git deploy)

### hPanel configuration
- [ ] Set Node.js version to 20 LTS
- [ ] Set **Build Command**: `npm install && npx prisma generate && npm run build`
- [ ] Set **Start Command**: `npm start`
- [ ] Add all environment variables (see table above)
- [ ] Confirm `UPLOAD_DIR` points outside the app root

### First deploy
- [ ] Trigger a build/deploy in hPanel
- [ ] Open SSH / terminal and run: `npx prisma migrate deploy`
- [ ] Run: `npx prisma db seed`
- [ ] Log in at `https://yourdomain.com/login` with `admin@dzc.internal` / `admin1234`
- [ ] **Change the admin password immediately**
- [ ] Delete or disable the seed credentials for `negotiator@dzc.internal` and `intake@dzc.internal`

### Verify
- [ ] App loads and login works
- [ ] Can create a client record (DB write confirmed)
- [ ] Can upload a document and re-download it (file system confirmed)

---

## Hostinger-Specific Risks and Caveats

### 1. App directory is ephemeral on redeploy
Hostinger replaces the app directory on each Git deploy. **Any files written inside the app root (including the default `./uploads` fallback) will be deleted.** Always set `UPLOAD_DIR` to a path outside the app root.

### 2. No shadow database in production
`schema.prisma` declares `shadowDatabaseUrl`. Leave `SHADOW_DATABASE_URL` unset in production — `prisma migrate deploy` never touches the shadow DB. Only `prisma migrate dev` (local only) uses it.

### 3. Node.js version must be 20+
The project uses React 19, Next.js 16, and TypeScript 5. Hostinger's older Node.js options (18 or below) may fail at build time. Pin to Node 20 LTS in hPanel.

### 4. PORT is managed by Hostinger
Do not hardcode a port. Next.js reads the `PORT` env var that Hostinger injects automatically.

### 5. AUTH_URL must match the production domain exactly
Auth.js uses `AUTH_URL` for redirect validation. A mismatch (e.g. `http` vs `https`, trailing slash) will break login callbacks.

### 6. MySQL strict mode
MySQL 8 on Hostinger runs with `STRICT_TRANS_TABLES` by default. Prisma handles this correctly, but any raw SQL in future code must be strict-mode-safe.

### 7. File size limit (server / proxy)
Hostinger's Nginx proxy default `client_max_body_size` may be lower than the app's 10 MB upload limit. If uploads fail silently, check hPanel's PHP/proxy settings or open a support ticket to raise the limit. There is no self-service nginx config on shared/Business plans.

### 8. Prisma `migrate deploy` vs `migrate dev`
Never run `prisma migrate dev` in production — it creates a shadow DB, applies migrations non-atomically, and is not safe for live data. Always use `prisma migrate deploy`.

# DZC DMS — DebtZeroCentral Management System

Internal case-management web app for the debt negotiation lifecycle. **Staff access only — not a public application.**

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| ORM | Prisma |
| Database | MySQL |
| Auth | Auth.js v5 (credentials, JWT session) |
| Validation | Zod |
| Deployment | Hostinger Node.js + MySQL |

---

## Local Development Setup

### Prerequisites

- Node.js LTS (v20+)
- MySQL 8 (local instance or remote dev DB)
- npm

### Steps

```bash
# 1. Clone and install dependencies
git clone <repo>
cd dzc-dms
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — fill in DATABASE_URL and AUTH_SECRET

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Seed dev data (creates admin@dzc.internal / admin1234)
npx prisma db seed

# 6. Start dev server
npm run dev
```

App runs at http://localhost:3000. Login at `/login`.

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `AUTH_SECRET` | Random secret for JWT signing — `openssl rand -base64 32` |
| `AUTH_URL` | Full public URL of the app (used for callbacks/redirects) |
| `NODE_ENV` | `development` or `production` |

---

## Folder Structure

```
src/
  app/
    (auth)/login/        ← Login page (public)
    (app)/dashboard/     ← Protected app pages
    api/auth/            ← Auth.js route handler
  components/
    auth/                ← LoginForm
    layout/              ← AppShell (sidebar nav)
    ui/                  ← shadcn/ui primitives
  lib/
    actions/             ← Server actions (auth, etc.)
    db/                  ← Prisma singleton
    validators/          ← Zod schemas
  auth.ts                ← Auth.js config
  middleware.ts          ← Route protection
prisma/
  schema.prisma          ← DB schema
  seed.ts                ← Dev seed data
```

---

## Hostinger Deployment

### Pre-requisites

1. Hostinger Business or Cloud plan with Node.js web app support
2. MySQL database created in hPanel (host is typically `localhost`)

### Steps

```bash
# 1. Push repo to GitHub

# 2. In Hostinger hPanel:
#    - Create a Node.js web app pointed at your repo / git deploy
#    - Set environment variables (production values)
#    - Build command: npm install && npx prisma generate && npm run build
#    - Start command: npm start

# 3. Run migration on production DB (first deploy and after schema changes):
npx prisma migrate deploy

# 4. Seed initial admin user (first deploy only):
npx prisma db seed
```

### Caveats

- Set `AUTH_URL` to your production domain (`https://yourdomain.com`)
- `DATABASE_URL` on Hostinger typically uses `localhost` as the host
- File uploads (later module): configure `UPLOAD_PATH` to a writable directory
- Prisma client is generated during the build step via `prisma generate`

---

## Default Dev Credentials

| Email | Password | Role |
|---|---|---|
| admin@dzc.internal | admin1234 | ADMIN |
| negotiator@dzc.internal | negotiator1234 | NEGOTIATOR |
| intake@dzc.internal | intake1234 | INTAKE |

**Change all seed passwords before any production deployment.**

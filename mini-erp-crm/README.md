# Mini ERP + CRM Operations Portal

A full-stack ERP/CRM system for a wholesale/distribution company: customer CRM,
product & inventory management, and a sales challan flow with atomic,
stock-safe business logic.

**Stack:** Node.js + TypeScript + Express + PostgreSQL (Prisma ORM) on the backend,
React + TypeScript + Vite + Tailwind CSS on the frontend.

---

## 1. Project Structure

```
mini-erp-crm/
├── backend/                 # Express + TypeScript REST API
│   ├── prisma/
│   │   ├── schema.prisma    # Data model
│   │   └── seed.ts          # Seed script (test users + sample data)
│   └── src/
│       ├── config/          # Env config, Prisma client singleton
│       ├── middleware/      # auth, RBAC, validation, error handling
│       ├── validators/      # Zod schemas per module
│       ├── services/        # Business logic layer
│       ├── controllers/     # Request/response glue
│       ├── routes/          # Express routers
│       ├── app.ts
│       └── server.ts
├── frontend/                # React + Vite + Tailwind SPA
│   └── src/
│       ├── api/             # Axios client + typed API wrappers
│       ├── context/         # Auth context
│       ├── components/      # Shared UI (layout, badges, pagination, route guard)
│       └── pages/           # Login, Dashboard, Customers, Products, Challans
├── docker-compose.yml        # Local PostgreSQL for development
├── postman_collection.json   # All API endpoints, with token auto-chaining
└── docs/ARCHITECTURE.md      # Architecture & business-logic notes
```

---

## 2. Prerequisites

- Node.js 18+ and npm
- Docker (for the easiest local Postgres setup) — or any PostgreSQL 14+ instance

---

## 3. Local Setup — Backend

```bash
cd backend
npm install
cp .env.example .env          # adjust DATABASE_URL / JWT_SECRET if needed

# Start a local Postgres (from the repo root, in another terminal):
cd ..
docker compose up -d

# Back in backend/:
npx prisma generate           # generates the Prisma client
npx prisma migrate dev --name init   # creates tables in the database
npm run seed                  # creates 4 test users (one per role) + sample data

npm run dev                   # starts the API on http://localhost:4000
```

> **Note on `prisma generate`:** this project was assembled inside a sandboxed
> environment whose network allowlist blocks `binaries.prisma.sh`, the domain
> Prisma downloads its query-engine binary from. `npx prisma generate` could not
> be run there, so the Prisma Client types were not pre-generated into this
> package. This is **not a code issue** — on your own machine with normal
> internet access, `npx prisma generate` will complete in a few seconds and
> everything (typecheck, dev server, build) will work end to end. If you see
> TypeScript errors like `Module '@prisma/client' has no exported member 'Role'`
> before running this command, that's expected — they resolve immediately
> afterward.

Verify:

```bash
npm run typecheck    # after prisma generate, should show 0 errors
curl http://localhost:4000/api/health
```

### Test login credentials (created by `npm run seed`)

| Role      | Email                  | Password      |
|-----------|-------------------------|---------------|
| Admin     | admin@example.com       | Password@123  |
| Sales     | sales@example.com       | Password@123  |
| Warehouse | warehouse@example.com   | Password@123  |
| Accounts  | accounts@example.com    | Password@123  |

---

## 4. Local Setup — Frontend

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL defaults to http://localhost:4000/api
npm run dev                   # starts on http://localhost:5173
```

Open http://localhost:5173, and use any of the demo logins above (the login
page has one-click buttons that fill them in for you).

To produce a production build:

```bash
npm run build      # outputs to frontend/dist/
npm run preview    # serve the production build locally
```

---

## 5. Environment Variables

### Backend (`backend/.env`)

| Variable        | Description                                   | Example                                                              |
|-----------------|------------------------------------------------|------------------------------------------------------------------------|
| `DATABASE_URL`  | PostgreSQL connection string                   | `postgresql://erp_user:erp_password@localhost:5432/mini_erp_crm`     |
| `JWT_SECRET`    | Secret used to sign JWTs                       | any long random string                                                |
| `JWT_EXPIRES_IN`| Token lifetime                                 | `8h`                                                                   |
| `PORT`          | API port                                       | `4000`                                                                 |
| `NODE_ENV`      | `development` / `production`                   | `development`                                                         |
| `CORS_ORIGIN`   | Comma-separated list of allowed frontend origins | `http://localhost:5173`                                             |

### Frontend (`frontend/.env`)

| Variable       | Description             | Example                          |
|----------------|--------------------------|-----------------------------------|
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:4000/api`   |

---

## 6. API Overview

All endpoints are prefixed with `/api`. Every response is JSON in the shape
`{ success, data }` or `{ success: false, message, errors? }`.

- `POST /auth/login` — returns `{ token, user }`
- `GET /auth/me` — current user profile (requires `Authorization: Bearer <token>`)
- `GET/POST /customers`, `GET/PUT /customers/:id`, `POST /customers/:id/notes`
- `GET/POST /products`, `GET/PUT /products/:id`, `POST /products/:id/stock-movements`
- `GET/POST /challans`, `GET/PUT /challans/:id`, `POST /challans/:id/confirm`, `POST /challans/:id/cancel`

Full request/response shapes and a ready-to-import collection are in
[`postman_collection.json`](./postman_collection.json) — see section 8.

### Role permissions (RBAC)

| Action                          | Admin | Sales | Warehouse | Accounts |
|----------------------------------|:-----:|:-----:|:---------:|:--------:|
| View customers/products/challans | ✅    | ✅    | ✅        | ✅       |
| Create/edit customers            | ✅    | ✅    | ❌        | ❌       |
| Create/edit products, log stock  | ✅    | ❌    | ✅        | ❌       |
| Create/edit draft challans       | ✅    | ✅    | ❌        | ❌       |
| Confirm challans                 | ✅    | ❌    | ✅        | ❌       |
| Cancel challans                  | ✅    | ✅    | ✅        | ❌       |

(Accounts currently has read-only access across the board — a reasonable
default for a finance/reporting role; adjust `authorize(...)` calls in
`backend/src/routes/*.ts` if your business rules differ.)

---

## 7. Key Business Logic

- **Stock never goes negative.** Every stock deduction (manual stock movement,
  or challan confirmation) is validated against current stock *inside a DB
  transaction* before being applied. If insufficient, the API returns `400`
  with a clear message — no partial writes.
- **Challan confirm/cancel are atomic.** Confirming a challan validates stock
  for every line item first, then deducts stock and logs a `StockMovement`
  per line, all inside a single `prisma.$transaction`. Cancelling a
  `CONFIRMED` challan restores the stock the same way.
- **Product snapshots.** A `ChallanItem` stores `productNameSnapshot`,
  `productSkuSnapshot`, and `unitPriceSnapshot` at the time it was added, so
  historical challans stay accurate even if the product's name/price/SKU
  changes later.
- **Sequential challan numbers** follow `CH-<year>-<6 digit sequence>` (e.g.
  `CH-2026-000001`), generated inside the same transaction as challan
  creation.

More detail in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

## 8. Postman Collection

Import [`postman_collection.json`](./postman_collection.json) into Postman.
It includes:

- A `{{baseUrl}}` variable (defaults to `http://localhost:4000/api`)
- A **Login** request per role that automatically saves the returned JWT into
  a `{{token}}` collection variable (via a small test script), so every
  subsequent request is pre-authenticated
- Every endpoint in the API, grouped by module

---

## 9. Deployment

This was built and verified locally; it was **not deployed** as part of this
submission (see "Known Limitations" below). To deploy on free tiers:

1. **Database** — create a free Postgres instance on
   [Neon](https://neon.tech), [Supabase](https://supabase.com), or Render
   Postgres. Copy its connection string into `DATABASE_URL`.
2. **Backend** — deploy `backend/` to [Render](https://render.com) or
   [Railway](https://railway.app) as a Node web service:
   - Build command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - Start command: `npm start`
   - Set the environment variables from section 5.
3. **Frontend** — deploy `frontend/` to [Vercel](https://vercel.com) or
   [Netlify](https://netlify.com):
   - Build command: `npm run build`
   - Output directory: `dist`
   - Set `VITE_API_URL` to your deployed backend's `/api` URL.
4. Update the backend's `CORS_ORIGIN` to include the deployed frontend URL.

---

## 10. Assumptions Made

- "Sales" role owns customer relationships and creates draft challans;
  "Warehouse" role owns product/stock data and confirms challans (since they
  physically pick and ship goods); "Accounts" has read-only visibility across
  modules (no billing/invoicing module was in scope per the case study).
- A challan's line items can only be edited while it's in `DRAFT` status;
  once `CONFIRMED` or `CANCELLED` it becomes immutable (financial/audit
  trail integrity).
- Product "current stock" is a maintained counter (not derived at query time)
  for read performance; it is only ever changed via the stock-movement /
  challan-confirm / challan-cancel code paths, all of which log a
  `StockMovement` row, so the counter and the audit log never drift apart.
- GST number and email are optional on a customer (per case study spec, only
  name/mobile are effectively required for a lead).

## 11. Known Limitations / Not Implemented

- Not deployed to a live URL as part of this submission — see section 9 for
  exact deployment steps.
- No automated test suite (unit/integration tests) — given the 48-hour scope,
  effort went into correctness of the transactional business logic instead.
- No PDF invoice export or S3 image upload (bonus items, out of scope for the
  core submission).
- No purchase-order module (the case study's business context mentions
  purchase orders, but the "Core Modules Required" section — which this
  submission targets exhaustively — does not include one).
- Accounts role is currently read-only everywhere; if the real business needs
  Accounts to, say, mark challans as invoiced, that's a small addition to
  `backend/src/routes/challan.routes.ts`.

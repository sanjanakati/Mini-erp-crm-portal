# Architecture

## Overview

A conventional 3-tier architecture: a React SPA talks to a stateless Express
REST API, which is the sole owner of the PostgreSQL database via Prisma ORM.

```
┌─────────────┐        HTTPS/JSON        ┌──────────────────┐        SQL        ┌────────────┐
│   React SPA │  ───────────────────▶   │  Express API      │ ───────────────▶ │ PostgreSQL │
│  (Vite, TS)  │  ◀───────────────────   │  (TypeScript,      │ ◀─────────────── │            │
└─────────────┘      JWT in header       │   Prisma ORM)      │                   └────────────┘
                                          └──────────────────┘
```

## Backend layering

Each module (customers, products, challans) follows the same layered
structure:

```
routes/*.ts        → wires URL + HTTP method + middleware to a controller
  ├─ authenticate     (verifies JWT, attaches req.user)
  ├─ authorize(roles)  (checks req.user.role against an allow-list)
  └─ validate(schema)  (Zod: parses & type-narrows req.body/query/params)

controllers/*.ts   → thin: extracts request data, calls a service, shapes the response
services/*.ts       → business logic: talks to Prisma, enforces invariants
                        (stock non-negativity, transactional confirm/cancel, etc.)
```

This keeps HTTP concerns (status codes, request parsing) separate from
business rules, so the business logic in `services/` could be reused by,
say, a future CLI tool or background job without touching Express at all.

### Error handling

A single `errorHandler` middleware (`middleware/error.ts`) catches everything
thrown anywhere in the request lifecycle:

- `AppError` (our own class) → mapped to its `statusCode` + `message`
- `Prisma.PrismaClientKnownRequestError` → mapped by Prisma error code
  (e.g. `P2002` unique constraint → `409 Conflict`, `P2025` not found →
  `404`, `P2003` FK violation → `400`)
- Anything else → `500`, with the real message only shown outside production

Every controller method is wrapped in `asyncHandler`, so a rejected promise
anywhere inside a service automatically reaches this middleware instead of
crashing the process or hanging the request.

### Authentication & RBAC

- `POST /auth/login` verifies the password with bcrypt and issues a JWT
  containing `{ userId, role, email }`.
- The `authenticate` middleware verifies that JWT on every subsequent
  request and attaches the decoded payload to `req.user`.
- The `authorize('ADMIN', 'SALES')` middleware factory is composed onto
  individual routes to restrict write operations to specific roles (see the
  RBAC table in the README).

### The transactional core: Sales Challans

This is the piece of business logic the case study cares most about, so it's
worth walking through explicitly.

**Creating a challan** (`POST /challans`, status starts as `DRAFT`):
1. Validate the customer and every referenced product exist.
2. Snapshot each product's current `name`, `sku`, and `unitPrice` onto the
   `ChallanItem` row (`productNameSnapshot` etc.) — so if the product's price
   changes next week, this challan's historical record is unaffected.
3. Generate the next sequential challan number (`CH-<year>-<seq>`) by
   counting existing challans with that year's prefix, inside the same
   transaction, so two concurrent creations can't collide.
4. **No stock is touched yet** — a draft is just a plan.

**Confirming a challan** (`POST /challans/:id/confirm`):
1. Must currently be `DRAFT`, else `400`.
2. For every line item, check `product.stock >= item.quantity`. If any line
   fails, the whole operation aborts with a `400` naming the offending
   product — before any writes happen.
3. Only after every line passes: decrement each product's stock and insert an
   `OUT` `StockMovement` row per line, referencing the challan in its
   `reason` field for traceability.
4. Mark the challan `CONFIRMED` with a `confirmedAt` timestamp.

All of steps 2–4 run inside one `prisma.$transaction`, so if step 3 were to
fail partway through (e.g. a concurrent request already consumed the stock),
the whole transaction rolls back — the challan stays `DRAFT` and no stock
is left half-deducted.

**Cancelling a challan** (`POST /challans/:id/cancel`):
- If the challan was `DRAFT`, cancelling is just a status change.
- If it was `CONFIRMED`, the stock that was deducted is restored — an `IN`
  `StockMovement` is logged per line — before the status flips to
  `CANCELLED`. This keeps the stock counter and the movement audit log
  consistent no matter which path a challan took.

### Why a maintained `stock` counter instead of deriving it from movements?

Summing all `StockMovement` rows on every read would be correct but slow as
the movement log grows. Instead, `Product.stock` is a counter that is
*only* ever mutated inside the same transaction that writes the
corresponding `StockMovement` row (in `product.service.ts`'s
`recordStockMovement`, and in the challan confirm/cancel paths above). That
invariant — "the counter and the log are always updated together" — is what
keeps them from drifting apart, and it's enforced by code review of those
three call sites rather than a database constraint, which is a reasonable
tradeoff at this scale.

## Frontend structure

- `context/AuthContext.tsx` — holds the logged-in user + JWT (persisted to
  `localStorage`), exposes `login()`/`logout()`.
- `components/ProtectedRoute.tsx` — a layout route that redirects to
  `/login` if unauthenticated, or shows an "Access denied" message if the
  user's role isn't in the route's `allowedRoles`.
- `api/*.ts` — one file per backend module, each exporting typed functions
  that wrap `axios` calls; this is the only place that knows the API's URL
  shapes, so pages stay free of fetch/URL logic.
- `pages/*` — one folder per module (Customers, Products, Challans), each
  with a `List`, `Form` (create+edit in one component), and `Detail` page.

## Data model summary

See `backend/prisma/schema.prisma` for the full source of truth. Key
relationships:

- `User` (1 role of 4) creates `Customer`s, `Product` stock movements, and
  `Challan`s — every write-side entity records `createdBy`/`createdById`
  for audit purposes.
- `Customer` 1—N `CustomerNote` (follow-ups) and 1—N `Challan`.
- `Product` 1—N `StockMovement` and 1—N `ChallanItem`.
- `Challan` 1—N `ChallanItem`, each pointing at a `Product` but carrying its
  own snapshot columns as described above.

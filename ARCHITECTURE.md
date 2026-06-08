# API Architecture — Five-Layer Design

## Layer Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
└────────────────────┬────────────────────────────────────────┘
                     │  HTTP Request
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 1:  ROUTES              (routes/*.routes.js)          │
│  ────────   Defines endpoints, mounts middleware             │
│             No business logic, no DB queries                  │
├─────────────────────────────────────────────────────────────┤
│  Layer 2:  CONTROLLERS         (controllers/*.controller.js)  │
│  ────────   Translates HTTP ↔ function calls                 │
│             Reads req.params/query/body                      │
│             Calls service, formats res.json()                 │
│             No business logic, no DB queries                  │
├─────────────────────────────────────────────────────────────┤
│  Layer 3:  SERVICES            (services/*.service.js)        │
│  ────────   Pure business logic                               │
│             No req/res, no Mongoose imports                   │
│             Orchestrates: validate → repo → cache             │
│             Throws AppError on rule violations                │
├─────────────────────────────────────────────────────────────┤
│  Layer 4:  REPOSITORIES        (repositories/*.repository.js) │
│  ────────   Data access abstraction                           │
│             Only Mongoose queries (find, create, update, etc) │
│             Returns plain objects via .lean()                 │
│             No business logic, no AppError                    │
├─────────────────────────────────────────────────────────────┤
│  Layer 5:  MODELS              (models/*.model.js)            │
│  ────────   Schema definitions + indexes                     │
│             Mongoose schema, validation, hooks                │
│             No business logic, no queries                     │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
server/
├── routes/
│   ├── clitool.routes.js      # GET/POST/PUT/DELETE /cli-tools
│   ├── user.routes.js         # GET /users/me, /users
│   ├── admin.routes.js        # GET /admin/stats
│   └── webhook.routes.js      # POST /webhooks/clerk
│
├── controllers/
│   ├── clitool.controller.js  # getCliTools, createCliTool, etc.
│   ├── user.controller.js     # getProfile, getAllUsers
│   ├── admin.controller.js    # getAdminStats
│   ├── cache-test.controller.js
│   └── webhook.controller.js  # handleClerkWebhook
│
├── services/
│   ├── clitool.service.js     # Tool/category CRUD logic + ML prediction
│   ├── user.service.js        # User sync, lookup
│   ├── admin.service.js       # Dashboard stats
│   ├── cache.service.js       # Redis getOrSet, invalidate
│   └── cache-test.service.js  # Cache benchmark
│
├── repositories/
│   ├── clitool.repository.js  # CliTool.find, .create, .aggregate
│   ├── category.repository.js # Category.find, .create, .delete
│   └── user.repository.js     # User.find, .upsert, .delete
│
├── models/
│   ├── clitool.model.js       # CliTool schema, text index, pre-save hook
│   ├── category.model.js      # Category schema, displayOrder index
│   └── user.model.js          # User schema
│
├── middlewares/
│   └── auth.middlewares.js    # protectRoute, restrictTo, validate
│
├── config/
│   └── redis.js               # ioredis client
│
├── utils/
│   ├── appError.js            # Custom error class
│   ├── catchAsync.js          # Async error wrapper
│   └── logger.js              # Winston logger
│
├── app.js                     # Express setup (middleware, routes, error handler)
└── server.js                  # Entry point (DB connect, cache warm, listen)
```

## Request Flow (Example: GET /api/v1/cli-tools?category=ai)

```
Request
  │
  ▼
app.js ──────────────────────────────────── helmet, cors, morgan, rate-limit
  │
  ▼
clitool.routes.js ───────────────────────── router.get('/', getCliTools)
  │
  ▼
clitool.controller.js ───────────────────── getCliTools(req, res)
  │   Reads req.query, calls service
  │   No DB queries here
  ▼
clitool.service.js ──────────────────────── getAllCliTools(filters)
  │   Cached with Redis getOrSet()
  │   On cache miss:
  │     ├─ categoryRepo.findCategoryBySlug(slug)  ────► MongoDB
  │     └─ cliToolRepo.findTools(filter, options)  ────► MongoDB
  │   Business logic: build filter, choose sort
  ▼
Controller formats res.json({ status, results, data })
```

## Layer Rules

| Layer | Knows About | Imports From | Error Handling |
|---|---|---|---|
| Routes | HTTP methods, middleware | controllers, middlewares | N/A |
| Controllers | req, res, next | services, zod schemas | catchAsync wraps async handlers |
| Services | Business rules | repositories, cache.service, utils | Throws AppError |
| Repositories | Mongoose models, queries | models only | Returns null/throws MongoDB errors |
| Models | Schema, indexes, hooks | mongoose | Mongoose validation errors |

## Key Principles

1. **Services never import mongoose/models directly** — all DB access goes through repositories
2. **Controllers never import models** — they only call services
3. **Repositories have no business logic** — no validation, no AppError, no ML prediction
4. **Services are HTTP-agnostic** — no req/res, same service can be used by REST, GraphQL, or CLI
5. **Cache invalidation lives in services** — it's orchestration, not data access
6. **Repository methods return plain objects** — always call `.lean()` before returning

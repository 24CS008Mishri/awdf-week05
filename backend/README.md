# AutoAdvisor Backend (Node.js + Express + MongoDB Atlas)

ES modules, layered design: `routes -> validators/middleware -> controllers -> services -> models`. Reusable middleware lives in the sibling `../middleware` package.

## Quick start
```
# 1) install (middleware first, then backend)
cd middleware && npm install && cd ../backend && npm install
# 2) configure
cp .env.example .env        # set MONGODB_URI (Atlas) and JWT_SECRET
# 3) seed demo data (cars, dealers, 400 days of price history + sales, tasks)
npm run seed:fresh
# 4) run
npm run dev                 # nodemon, http://localhost:5000/api
npm test                    # 28 tests (unit + API, no database needed)
```
MongoDB Atlas: create a cluster, a Database Access user, add your IP under Network Access, paste the SRV string into `MONGODB_URI`.

Seed logins: `admin@demo.in / admin123` · `customer@demo.in / demo123` · `dealer@demo.in / demo123` (approved) · `wheels@demo.in / demo123` (pending approval).

## Folder structure
```
backend/src
  config/       env (dotenv), db (Mongoose), auth (JWT wiring)
  models/       User Company Car Variant DealerProfile DealerListing Offer PriceHistory SalesReport Favorite Comparison AiInteraction AuditLog Task
  validators/   express-validator rules
  controllers/  auth car company favorite comparison dealer admin ai task stats
  services/     carQuery trending price ranking compare advisor ai ai.fallbacks
  events/       appEvents (EventEmitter) + handlers
  jobs/         daily price snapshots, offer expiry
  seed/         seed.js
  routes/       index.js (all endpoints)
middleware/src  auth validate errorHandler requestLogger cache rateLimiter security ApiError asyncHandler
```

## Syllabus map
| Topic | Where |
|---|---|
| Express + dotenv, CRUD, morgan, global error handler | `app.js`, `config/env.js`, `middleware/requestLogger.js`, `middleware/errorHandler.js`, Task CRUD in `routes/index.js` |
| Mongoose + Atlas, Task schema (title, description, status, priority, dueDate; required/default/enum) | `config/db.js`, `models/Task.js`, `controllers/task.controller.js` (`find`, `create`, `findOneAndUpdate`, `findOneAndDelete`) |
| Auth: bcrypt, JWT, protected routes, validation, 401/403 | `models/User.js`, `controllers/auth.controller.js`, `middleware/auth.js`, `validators/` |
| node-cache, 60 s TTL, invalidation on writes | `middleware/cache.js`, `GET /api/tasks`, `GET /api/cars*` |
| EventEmitter, `task-created`, async handler | `events/`, `createTask` |
| AI API (key only in `.env`, graceful degradation) | `services/ai.service.js`, `POST /api/tasks/ai-description`, `/api/ai/*` |
| Postman / Thunder Client | `postman/AutoAdvisor.postman_collection.json` |

## Endpoints (prefix `/api`)
| Group | Endpoints |
|---|---|
| Auth | `POST /auth/register` `POST /auth/login` `GET /auth/me` `POST /auth/logout` |
| Cars | `GET /cars` (filters, sort, pagination, `sort=trend&period=today\|month\|year&city=`) · `GET /cars/:id` · `GET /cars/:id/price-history?period=daily\|monthly\|yearly&variant=` · `GET /cars/:id/dealers?city=&date=&variant=&priority=price\|rating\|benefits` · admin: `POST/PUT/DELETE /cars` |
| Companies | `GET /companies` `GET /companies/:id` admin: `POST/PUT/DELETE` |
| Favourites | `GET /favorites` `GET /favorites/ids` `POST /favorites/:carId` `DELETE /favorites/:carId` |
| Comparisons | `GET/POST /comparisons` `DELETE /comparisons/:id` |
| AI | `POST /ai/overview` `/ai/price-insight` `/ai/dealers` `/ai/advisor` `/ai/compare` · `GET /ai/status` |
| Dealer (role dealer) | `GET/PUT /dealer/profile` · `GET/POST /dealer/listings` `PUT/DELETE /dealer/listings/:id` · `GET/POST /dealer/offers` `PUT/DELETE /dealer/offers/:id` `POST /dealer/offers/:id/expire` · `GET /dealer/sales` `POST/PUT /dealer/sales` `GET /dealer/sales/summary` · `GET /dealer/price-history` |
| Admin (role admin) | `GET /admin/overview` · `/admin/dealers` + `PATCH /admin/dealers/:id/status` · `/admin/users` + `PATCH /admin/users/:id/status` · `/admin/offers` + `PATCH .../expire` · `/admin/listings` · `/admin/price-updates` · `/admin/sales` + `PATCH /admin/sales/:id/flag` + `PATCH /admin/sales/:id` (correction, reason required) · `/admin/freshness` · `/admin/audit` |
| Tasks (JWT) | `GET/POST /tasks` · `GET/PUT/DELETE /tasks/:id` · `POST /tasks/ai-description` · `GET /tasks/events/notifications` |
| Misc | `GET /health` `GET /stats` |

Error shape: `{ "success": false, "status": 422, "message": "Validation failed", "errors": [{ "field": "email", "message": "..." }] }`. Auth failures: 401 (missing/invalid/expired token), 403 (wrong role, suspended account, unapproved dealer).

## Business rules implemented
- Price history is snapshots (`PriceHistory`, unique per listing per day). A price change writes today's record only; earlier days are never overwritten. A job snapshots all active listings daily. Averages are `SUM(price)/COUNT(observations)` computed in MongoDB, missing is never zero.
- Dealer ranking is deterministic (`services/ranking.service.js`): effective price = listed − guaranteed discount of the best offer valid on the date. Exchange/corporate bonuses are never counted. Future dates are labelled scheduled unless the offer is guaranteed. The LLM only explains.
- Trending: `SUM(units)` over approved dealers' reports in the period (flagged reports excluded). Cars without reports are listed last with `reportedUnits: null`.
- Sales reports are unique per dealer+car+variant+day; a correction replaces the units. Labelled dealer-reported.
- Dealers cannot publish until an admin approves them. Admin cannot be registered via the API. Admin edits (cars, dealer status, sales corrections) are written to `AuditLog`.

## Measuring the cache (Postman, 3 readings each)
`GET /api/tasks` returns header `X-Cache: MISS` (database) then `HIT` (memory) for 60 s. Any POST/PUT/DELETE on tasks clears that user's cache.
| Reading | Uncached (MISS) ms | Cached (HIT) ms |
|---|---|---|
| 1 | | |
| 2 | | |
| 3 | | |

To get a MISS again, create/update a task (or wait 60 s). **Why process-local cache does not scale:** each Node instance has its own memory, so with several instances a write on instance A does not invalidate instance B's copy and users can see stale data; use a shared cache such as Redis.

## Proving the event is non-blocking
`POST /api/tasks` responds 201 first; `task-created` is emitted afterwards and its handler waits `EVENT_HANDLER_DELAY_MS` (default 1500 ms). Server console shows:
```
[event] task-created received   ...T10:00:00.012Z  (api responded ...T10:00:00.010Z)
[event] task-created completed  ...T10:00:01.515Z  (+1503 ms) Notification: task "..." assigned to Demo Customer
```
Also stored in `logs/notifications.log` and at `GET /api/tasks/events/notifications` (apiRespondedAt < handlerStartedAt < handlerFinishedAt).

## AI configuration
Set `AI_PROVIDER=openai|gemini` plus the matching key in `.env`. With `none`, a missing key, a timeout (`AI_TIMEOUT_MS`) or a provider error, every AI route still returns 200 with deterministic text and `ai.source: "fallback"`. Real LLM answers are cached (60 min in memory, 30 days in `aiInteractions`); the car overview cache key includes the car's `updatedAt`, so it regenerates when the data changes, or send `refresh: true`.

## Security
Helmet, CORS allow-list, request body limit, NoSQL operator sanitising, rate limits (global, auth, AI), bcrypt cost 12, JWT with expiry, validation before the database, whitelisted updates (no mass assignment), per-user query scoping for favourites and tasks.

## Verified here
`npm test`: 28 passing tests cover price aggregation, ranking, trending, filters, advisor, comparison, AI fallback, cache, sanitising, the event bus, and API auth/validation/error responses. Endpoints that read or write MongoDB need your Atlas connection, so run the Postman collection after `npm run seed:fresh`.

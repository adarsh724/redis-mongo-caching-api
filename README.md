# Stockroom — Full-Stack Inventory & Auth Platform

A full-stack inventory management app — React frontend, Node.js/Express/MongoDB/Redis backend — built to explore Redis in a real application context: not just as a cache, but as infrastructure for authentication, session revocation, and rate limiting. Started as a simple caching exercise, grew into a tested, deployed auth system with a documented concurrency bug fix.

🔗 **Live app:** [stockroom-app-d4gg.onrender.com](https://stockroom-app-d4gg.onrender.com/products)
🔗 **API:** [stockroom-redid.onrender.com](https://stockroom-redid.onrender.com)

> Note: both are hosted on Render's free tier, which spins down after inactivity — the first request after a period of idleness may take 30–60 seconds to respond while the instance wakes up.

## Features

**Backend**
- **Cache-aside caching** (products & users) — Redis-first reads, MongoDB fallback, TTL-based expiry, explicit invalidation on writes, search-aware cache keys
- **JWT authentication** — access tokens (short-lived) + refresh tokens (long-lived), stored/revocable via Redis
- **Role-based access control** — admin-only routes (product management), resource-ownership checks (users can only access their own data)
- **Token blacklist / logout** — revokes a token before its natural expiry using Redis TTL matching the token's remaining lifetime
- **Atomic rate limiting** — token-bucket algorithm implemented as a Redis Lua script (`EVAL`), applied to login and signup routes
- **Centralized error handling**, Helmet, CORS, Morgan request logging
- **Automated tests** — Jest + Supertest covering the full auth lifecycle and rate limiter behavior under concurrent load

**Frontend**
- React (Vite) + Tailwind CSS
- Full auth flow with silent access-token refresh on page reload (no unexpected logouts)
- Product browsing — category filters, pagination, debounced search
- Admin dashboard — create/edit/delete products, with its own search to manage large inventories
- Role-based routing (regular users vs. admins see different views)
- Responsive — mobile nav collapses to a hamburger menu, admin table scrolls horizontally on narrow screens

## Tech Stack

**Backend:** Node.js · Express · MongoDB (Mongoose) · Redis (node-redis) · JWT · bcrypt · Jest · Supertest · Helmet
**Frontend:** React · Vite · Tailwind CSS · React Router · Axios
**Infra:** Render (backend + frontend hosting) · MongoDB Atlas · Upstash Redis

## Setup

### Backend
```bash
npm install
```

Create a `.env` file in the project root:
```
MONGO_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
MY_SECRET_KEY=your_access_token_secret
REFRESH_SECRET_KEY=your_refresh_token_secret
PORT=8000
ALLOWED_ORIGIN=http://localhost:5173
```

Run the server:
```bash
npm run dev     # nodemon
npm start        # plain node
```

Run tests:
```bash
npm test
```

### Frontend
```bash
cd client
npm install
```

Create `client/.env`:
```
VITE_API_URL=http://localhost:8000
```

Run the dev server:
```bash
npm run dev
```

Both servers need to run simultaneously for the app to work locally.

## API Overview

### Users
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/users/create` | Public (rate-limited) | Register a new user |
| POST | `/api/users/login` | Public (rate-limited) | Log in, returns access + refresh tokens |
| POST | `/api/users/refresh` | Public | Exchange a valid refresh token for a new access token |
| POST | `/api/users/logout` | Required | Revokes the current access + refresh tokens |
| GET | `/api/users` | Admin only | List all users |
| GET | `/api/users/:id` | Required (self only) | Get a single user |
| PUT | `/api/users/:id` | Required (self only) | Update user details (password updates not permitted here) |
| DELETE | `/api/users/:id` | Required (self only) | Delete a user |

### Products
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | Any logged-in user | List products (paginated, filterable, searchable, cached) |
| GET | `/api/products/:id` | Any logged-in user | Get a single product (cached) |
| POST | `/api/products` | Admin only | Create a product |
| PUT | `/api/products/:id` | Admin only | Update a product |
| DELETE | `/api/products/:id` | Admin only | Delete a product |

## Caching Strategy

Uses the **cache-aside pattern**: on read, check Redis first; on a miss, query MongoDB and populate the cache with a TTL. On any write (create/update/delete), the relevant single-item key is deleted, and list/pagination/search cache variants are invalidated via `SCAN`-based pattern matching, since Redis has no way to know which cached list entries contain a given item.

**Locally**, this cuts a ~75ms MongoDB query down to a ~5ms cache hit.

**In production**, the numbers tell a different, more honest story:

| | Cache miss | Cache hit |
|---|---|---|
| Local (same machine) | ~75ms | ~5ms |
| Deployed (Render + Upstash, cross-region) | ~1311ms | ~273ms |

The backend is hosted on Render's US region; Redis (Upstash) is hosted in Mumbai. Every cache call — hit or miss — now pays a real cross-continent network round trip. Caching still provides a genuine ~4.8x speedup on hits, but the absolute numbers are dominated by geography, not the caching logic itself. **A cache that's slower to reach than the primary database defeats its own purpose** — this is a deliberate trade-off of free-tier hosting across regions, not a bug, and the fix (colocating backend and cache in the same region) requires a paid tier on at least one side.

## Rate Limiting — Design Notes

Implemented as a **token bucket**: each identifier (email for login, IP for signup) gets a bucket of tokens that refill at a steady rate, allowing short bursts while capping sustained request volume.

**A bug worth documenting:** the first implementation read the bucket state (`HGETALL`), computed the new token count in Node, then wrote it back (`HSET`) as two separate Redis round-trips. Under concurrent load — verified with a `Promise.all`-based test firing 10 simultaneous requests against a bucket with capacity 5 — this let **all 10 requests through**, since every request read the same stale "full bucket" state before any of them had written back their decrement.

**Fix:** the entire read-check-decrement-write sequence was moved into a Redis Lua script, executed via `EVAL`. Redis runs Lua scripts atomically — no other command can interleave mid-script — so concurrent requests are now correctly serialized against the same key. Re-running the identical concurrent test after the fix shows exactly 5 of 10 requests allowed through, matching the configured capacity.

This is covered by an automated test in `tests/rateLimiter.test.js`.

## Known Trade-offs / Next Steps

- No email verification on signup — any email address, real or made up, can currently register. Would add a verification-token flow (Redis TTL + email send) before handling real user data.
- Backend and Redis are in different regions in the current deployment (see caching section above) — colocating them would require a paid tier.
- Tests currently run against the real MongoDB instance (with generated, unique test data and post-test cleanup) rather than a dedicated test database — a `.env.test` setup would be the next step for full isolation, especially if a CI pipeline is added.
- List-cache invalidation is intentionally broad (clears all cached variants on any write) rather than scoped to the specific affected category — a reasonable trade-off at this project's scale.
- Signup rate limiting is IP-based, which can affect users sharing a network (offices, VPNs) — acceptable for this project's scope.
- Render's free tier spins down after inactivity, causing a 30–60s cold start on the first request after idle — a paid tier or keep-alive ping would resolve this.

## Testing

```bash
npm test
```

Covers:
- Full auth lifecycle: signup → duplicate-signup rejection → login → wrong-password rejection → protected-route access control
- Rate limiter correctness under concurrent load (the exact scenario that exposed the race condition above)

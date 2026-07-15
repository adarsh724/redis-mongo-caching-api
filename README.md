# Redis Caching, Auth & Rate Limiting API

A Node.js/Express REST API built to explore Redis in a real backend context — not just as a cache, but as infrastructure for authentication, session revocation, and rate limiting. Started as a simple caching exercise and grew into a small, tested auth system with a documented concurrency bug fix.

## Features

- **Cache-aside caching** (products & users) — Redis-first reads, MongoDB fallback, TTL-based expiry, explicit invalidation on writes
- **JWT authentication** — access tokens (short-lived) + refresh tokens (long-lived), stored/revocable via Redis
- **Role-based access control** — admin-only routes, resource-ownership checks
- **Token blacklist / logout** — revokes a token before its natural expiry using Redis TTL matching the token's remaining lifetime
- **Atomic rate limiting** — token-bucket algorithm implemented as a Redis Lua script (`EVAL`), applied to login and signup routes
- **Automated tests** — Jest + Supertest covering the full auth lifecycle and rate limiter behavior under concurrent load

## Tech Stack

Node.js · Express · MongoDB (Mongoose) · Redis (node-redis) · JWT · bcrypt · Jest · Supertest

## Setup

```bash
npm install
```

Create a `.env` file in the project root:
```
MONGO_URI=your_mongodb_connection_string
REDIS_URL=redis://localhost:6379
MY_SECRET_KEY=your_access_token_secret
REFRESH_SECRET_KEY=your_refresh_token_secret
PORT=8000
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
| Method | Route | Description |
|---|---|---|
| GET | `/api/products` | List products (paginated, filterable, cached) |
| GET | `/api/products/:id` | Get a single product (cached) |
| POST | `/api/products` | Create a product |
| PUT | `/api/products/:id` | Update a product |
| DELETE | `/api/products/:id` | Delete a product |

## Caching Strategy

Uses the **cache-aside pattern**: on read, check Redis first; on a miss, query MongoDB and populate the cache with a TTL. On any write (create/update/delete), the relevant single-item key is deleted, and list/pagination caches are invalidated via `SCAN`-based pattern matching, since Redis has no way to know which cached list entries contain a given item.

## Rate Limiting — Design Notes

Implemented as a **token bucket**: each identifier (email for login, IP for signup) gets a bucket of tokens that refill at a steady rate, allowing short bursts while capping sustained request volume.

**A bug worth documenting:** the first implementation read the bucket state (`HGETALL`), computed the new token count in Node, then wrote it back (`HSET`) as two separate Redis round-trips. Under concurrent load — verified with a `Promise.all`-based test firing 10 simultaneous requests against a bucket with capacity 5 — this let **all 10 requests through**, since every request read the same stale "full bucket" state before any of them had written back their decrement.

**Fix:** the entire read-check-decrement-write sequence was moved into a Redis Lua script, executed via `EVAL`. Redis runs Lua scripts atomically — no other command can interleave mid-script — so concurrent requests are now correctly serialized against the same key. Re-running the identical concurrent test after the fix shows exactly 5 of 10 requests allowed through, matching the configured capacity.

This is covered by an automated test in `tests/rateLimiter.test.js`.

## Known Trade-offs / Next Steps

- Tests currently run against the real MongoDB instance (with generated, unique test data and post-test cleanup) rather than a dedicated test database — a `.env.test` setup would be the next step for full isolation, especially if a CI pipeline is added.
- List-cache invalidation is intentionally broad (clears all cached variants on any write) rather than scoped to the specific affected category — a reasonable trade-off at this project's scale, worth revisiting if list-cache variants grow significantly.
- Signup rate limiting is IP-based, which can affect users sharing a network (offices, VPNs) — acceptable for this project's scope.

## Testing

```bash
npm test
```

Covers:
- Full auth lifecycle: signup → duplicate-signup rejection → login → wrong-password rejection → protected-route access control
- Rate limiter correctness under concurrent load (the exact scenario that exposed the race condition above)

# Redis Caching with Node.js, Express & MongoDB

A REST API demonstrating the cache-aside pattern using Redis as a caching layer in front of MongoDB.

## Features
- CRUD operations for products
- Cache-aside pattern: Redis-first reads, MongoDB fallback
- Automatic cache invalidation on create/update/delete
- TTL-based expiry for list/pagination caches

## Tech Stack
Node.js, Express, MongoDB (Mongoose), Redis (node-redis)

## Setup
\`\`\`bash
npm install
# add MONGO_URI and REDIS_URL to a .env file
npm run dev
\`\`\`

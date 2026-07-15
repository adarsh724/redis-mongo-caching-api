// middlewares/tokenBucketLimiter.js
const redisClient = require('../config/redisClient');

const tokenBucketScript = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(bucket[1])
local lastRefill = tonumber(bucket[2])

if tokens == nil then
  tokens = capacity
  lastRefill = now
end

local elapsed = now - lastRefill
tokens = math.min(capacity, tokens + elapsed * refillRate)

if tokens < 1 then
  redis.call('HSET', key, 'tokens', tokens, 'lastRefill', now)
  redis.call('EXPIRE', key, 3600)
  return 0
end

tokens = tokens - 1
redis.call('HSET', key, 'tokens', tokens, 'lastRefill', now)
redis.call('EXPIRE', key, 3600)
return 1
`;

function tokenBucketMiddleware({ capacity = 5, refillRatePerSecond = 1, keyFn }) {
  return async (req, res, next) => {
    try {
      const identifier = keyFn(req);
      const key = `ratelimit:${identifier}`;
      const now = Date.now() / 1000;

      const allowed = await redisClient.eval(tokenBucketScript, {
        keys: [key],
        arguments: [capacity.toString(), refillRatePerSecond.toString(), now.toString()]
      });

      if (allowed === 0) {
        return res.status(429).json({ error: "Too many requests. Please slow down." });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error.message);
      next(); // fail open
    }
  };
}

module.exports = tokenBucketMiddleware;
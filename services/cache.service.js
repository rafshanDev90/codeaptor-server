import redis from "../config/redis.js";

const DEFAULT_TTL = 60;

function cacheKey(prefix, identifier) {
  return `${prefix}:${identifier}`;
}

async function getOrSet(key, fetchFn, ttl = DEFAULT_TTL) {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Redis down — fall through to fetchFn
  }

  const data = await fetchFn();

  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch {
    // Cache write failure is non-fatal
  }

  return data;
}

async function invalidate(pattern) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export { getOrSet, invalidate, cacheKey, DEFAULT_TTL };
import redisio from "ioredis";

const host = process.env.REDIS_HOST || "localhost";
const port = process.env.REDIS_PORT || "6379";

const redis = new redisio(`redis://${host}:${port}`, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) return null;
    return Math.min(times * 100, 3000);
  },
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

redis.on("connect", () => {
  console.log("Redis connected");
});

export default redis;

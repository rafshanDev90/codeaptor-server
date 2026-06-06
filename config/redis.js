import redisio from "ioredis";

const redis = new redisio("redis://localhost:6379", {
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

// 👇 ADD THIS LINE AT THE BOTTOM
export default redis;
import { Redis } from 'ioredis';

const redis = new Redis();
await redis.flushall();
console.log('Redis cache flushed');
redis.disconnect();

import { createClient } from 'redis';
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully!');
});
export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}
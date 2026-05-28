import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

const MAX_RETRY_ATTEMPTS = 10;

// Setup a custom retry strategy with exponential backoff and connection limit
const retryStrategy = (times: number): number | null => {
  if (times > MAX_RETRY_ATTEMPTS) {
    logger.error(`💥 Redis connection failed after ${MAX_RETRY_ATTEMPTS} attempts. Stopping reconnect retries.`);
    return null; // Stops reconnect attempts
  }

  const delay = Math.min(times * 200, 3000);
  logger.warn(`🔌 Redis connection lost. Reconnect attempt #${times} in ${delay}ms...`);
  return delay;
};

// Create a reusable Redis Client Singleton instance
// export const redis = new Redis({
//   host: env.REDIS_HOST,
//   port: env.REDIS_PORT,
//   retryStrategy,
//   maxRetriesPerRequest: null, // Essential for BullMQ and robust reconnection operations
// });




export const redis = new Redis(
  env.REDIS_URL,
  {
    retryStrategy,
    maxRetriesPerRequest: null,

    tls: {}
  }
);




// Configure client event logging
redis.on('connect', () => {
  logger.info('🔌 Connecting to Redis...');
});

redis.on('ready', () => {
  logger.info('✅ Redis connection established successfully!');
});

redis.on('error', (err: any) => {
  logger.error(`❌ Redis connection error: ${err.message}`, err);
});

redis.on('close', () => {
  logger.warn('🔌 Redis client connection closed!');
});

redis.on('reconnecting', () => {
  logger.info('🔄 Redis client reconnecting...');
});

/**
 * Gracefully disconnect from Redis
 */
export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redis.status !== 'end') {
      await redis.quit();
      logger.info('✅ Redis client connection closed gracefully.');
    }
  } catch (error: any) {
    logger.error(`💥 Error while closing Redis connection: ${error.message}`, error);
  }
};

export interface RedisHealth {
  status: 'healthy' | 'unhealthy' | 'connecting' | 'reconnecting';
  readyState: string;
}

/**
 * Check the health status of the Redis client connection
 */
export const checkRedisHealth = (): RedisHealth => {
  const readyState = redis.status;

  const isHealthy = readyState === 'ready';
  const isConnecting = readyState === 'connect' || readyState === 'connecting';
  const isReconnecting = readyState === 'reconnecting';

  let status: RedisHealth['status'] = 'unhealthy';
  if (isHealthy) status = 'healthy';
  else if (isConnecting) status = 'connecting';
  else if (isReconnecting) status = 'reconnecting';

  return {
    status,
    readyState,
  };
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRedisHealth = exports.disconnectRedis = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
const MAX_RETRY_ATTEMPTS = 10;
// Setup a custom retry strategy with exponential backoff and connection limit
const retryStrategy = (times) => {
    if (times > MAX_RETRY_ATTEMPTS) {
        logger_1.logger.error(`💥 Redis connection failed after ${MAX_RETRY_ATTEMPTS} attempts. Stopping reconnect retries.`);
        return null; // Stops reconnect attempts
    }
    const delay = Math.min(times * 200, 3000);
    logger_1.logger.warn(`🔌 Redis connection lost. Reconnect attempt #${times} in ${delay}ms...`);
    return delay;
};
// Create a reusable Redis Client Singleton instance
// export const redis = new Redis({
//   host: env.REDIS_HOST,
//   port: env.REDIS_PORT,
//   retryStrategy,
//   maxRetriesPerRequest: null, // Essential for BullMQ and robust reconnection operations
// });
exports.redis = new ioredis_1.default(env_1.env.REDIS_URL, {
    retryStrategy,
    maxRetriesPerRequest: null,
    tls: {}
});
// Configure client event logging
exports.redis.on('connect', () => {
    logger_1.logger.info('🔌 Connecting to Redis...');
});
exports.redis.on('ready', () => {
    logger_1.logger.info('✅ Redis connection established successfully!');
});
exports.redis.on('error', (err) => {
    logger_1.logger.error(`❌ Redis connection error: ${err.message}`, err);
});
exports.redis.on('close', () => {
    logger_1.logger.warn('🔌 Redis client connection closed!');
});
exports.redis.on('reconnecting', () => {
    logger_1.logger.info('🔄 Redis client reconnecting...');
});
/**
 * Gracefully disconnect from Redis
 */
const disconnectRedis = async () => {
    try {
        if (exports.redis.status !== 'end') {
            await exports.redis.quit();
            logger_1.logger.info('✅ Redis client connection closed gracefully.');
        }
    }
    catch (error) {
        logger_1.logger.error(`💥 Error while closing Redis connection: ${error.message}`, error);
    }
};
exports.disconnectRedis = disconnectRedis;
/**
 * Check the health status of the Redis client connection
 */
const checkRedisHealth = () => {
    const readyState = exports.redis.status;
    const isHealthy = readyState === 'ready';
    const isConnecting = readyState === 'connect' || readyState === 'connecting';
    const isReconnecting = readyState === 'reconnecting';
    let status = 'unhealthy';
    if (isHealthy)
        status = 'healthy';
    else if (isConnecting)
        status = 'connecting';
    else if (isReconnecting)
        status = 'reconnecting';
    return {
        status,
        readyState,
    };
};
exports.checkRedisHealth = checkRedisHealth;

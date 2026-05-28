"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addGenerationJob = exports.generationQueue = exports.QUEUE_NAME = void 0;
const bullmq_1 = require("bullmq");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const socket_1 = require("../socket/socket");
exports.QUEUE_NAME = 'ai-question-generation';
// Dedicated Redis Connection configuration for the Queue client
const connection = {
    host: env_1.env.REDIS_HOST,
    port: env_1.env.REDIS_PORT,
    maxRetriesPerRequest: null,
};
// Export the singleton Generation Queue instance
exports.generationQueue = new bullmq_1.Queue(exports.QUEUE_NAME, {
    connection,
    defaultJobOptions: {
        attempts: 1,
        backoff: {
            type: 'exponential',
            delay: 2000, // 2s starting delay
        },
        removeOnComplete: {
            age: 24 * 3600, // Keep completed job metadata for 24h
            count: 1000,
        },
        removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
    },
});
/**
 * Enqueue a new AI Question Generation job
 */
const addGenerationJob = async (data) => {
    try {
        const job = await exports.generationQueue.add(`generate-paper-${data.jobId}`, data);
        logger_1.logger.info(`📥 Enqueued AI generation job #${job.id} for user ${data.userId} [JobRef: ${data.jobId}]`);
        // Emit 'job:queued' event via WebSockets
        (0, socket_1.emitToJobRoom)(data.jobId, 'job:queued', { jobId: data.jobId, progress: 0 });
        return job;
    }
    catch (error) {
        logger_1.logger.error(`💥 Failed to enqueue generation job in BullMQ: ${error.message}`, error);
        throw error;
    }
};
exports.addGenerationJob = addGenerationJob;

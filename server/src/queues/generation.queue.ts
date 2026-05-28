import { Queue } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { emitToJobRoom } from '../socket/socket';

export const QUEUE_NAME = 'ai-question-generation';

export interface GenerationJobPayload {
  userId: string;
  prompt: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  jobId: string; // MongoDB GenerationJobStatus ID
  assignmentId?: string; // Optional MongoDB Assignment ID
  extractedText?: string; // Optional extracted reference material text
  questionRows?: any[];
}

// Dedicated Redis Connection configuration for the Queue client
const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
};

// Export the singleton Generation Queue instance
export const generationQueue = new Queue<GenerationJobPayload>(QUEUE_NAME, {
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
export const addGenerationJob = async (data: GenerationJobPayload) => {
  try {
    const job = await generationQueue.add(`generate-paper-${data.jobId}`, data);
    logger.info(`📥 Enqueued AI generation job #${job.id} for user ${data.userId} [JobRef: ${data.jobId}]`);

    // Emit 'job:queued' event via WebSockets
    emitToJobRoom(data.jobId, 'job:queued', { jobId: data.jobId, progress: 0 });

    return job;
  } catch (error: any) {
    logger.error(`💥 Failed to enqueue generation job in BullMQ: ${error.message}`, error);
    throw error;
  }
};

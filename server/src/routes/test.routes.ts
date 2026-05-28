import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { addGenerationJob } from '../queues/generation.queue';
import { GenerationJobStatus } from '../models/generationJobStatus';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route POST /api/test/generate
 * @desc Enqueue a dummy AI question paper generation task for testing
 */
router.post(
  '/generate',
  asyncHandler(async (req: Request, res: Response) => {
    // 1. Gather params from body or fallback to rich defaults
    const userId = req.body.userId || 'test-teacher-789';
    const prompt = req.body.prompt || 'Create a standard midterm exam on molecular chemistry and kinetics.';
    const subject = req.body.subject || 'Chemistry';
    const difficulty = req.body.difficulty || 'medium';

    logger.info(`🧪 Test Endpoint: Enqueueing generation job for subject "${subject}"...`);

    // 2. Initialize tracking document in MongoDB
    const jobStatus = new GenerationJobStatus({
      userId,
      prompt,
      status: 'pending',
      progress: 0,
    });
    const savedJobStatus = await jobStatus.save();
    logger.info(`💾 Database tracking record initialized [ID: ${savedJobStatus._id}]`);

    // 3. Enqueue job into BullMQ
    const bullJob = await addGenerationJob({
      userId,
      prompt,
      subject,
      difficulty,
      jobId: (savedJobStatus._id as any).toString(),
    });

    // 4. Return success immediately containing both tracking and queue job reference IDs
    res.status(201).json({
      success: true,
      message: 'AI Question paper generation job enqueued successfully.',
      data: {
        jobId: savedJobStatus._id,
        bullJobId: bullJob.id,
      },
    });
  })
);

export default router;

import { Router } from 'express';
import { GenerationJobStatus } from '../models/generationJobStatus';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

const router = Router();

// Retrieve job status & progress for state recovery
router.get('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  logger.info(`🔍 API: Fetching job status for Job ID: ${id}`);
  
  const job = await GenerationJobStatus.findById(id);
  
  if (!job) {
    logger.warn(`⚠️ API Warning: Job status tracker not found for Job ID: ${id}`);
    throw new AppError('Job status tracker not found.', 404);
  }
  
  res.status(200).json({
    success: true,
    data: {
      status: job.status,
      progress: job.progress,
      error: job.error,
    },
  });
}));

export default router;

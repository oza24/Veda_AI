"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../middleware/asyncHandler");
const generation_queue_1 = require("../queues/generation.queue");
const generationJobStatus_1 = require("../models/generationJobStatus");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * @route POST /api/test/generate
 * @desc Enqueue a dummy AI question paper generation task for testing
 */
router.post('/generate', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // 1. Gather params from body or fallback to rich defaults
    const userId = req.body.userId || 'test-teacher-789';
    const prompt = req.body.prompt || 'Create a standard midterm exam on molecular chemistry and kinetics.';
    const subject = req.body.subject || 'Chemistry';
    const difficulty = req.body.difficulty || 'medium';
    logger_1.logger.info(`🧪 Test Endpoint: Enqueueing generation job for subject "${subject}"...`);
    // 2. Initialize tracking document in MongoDB
    const jobStatus = new generationJobStatus_1.GenerationJobStatus({
        userId,
        prompt,
        status: 'pending',
        progress: 0,
    });
    const savedJobStatus = await jobStatus.save();
    logger_1.logger.info(`💾 Database tracking record initialized [ID: ${savedJobStatus._id}]`);
    // 3. Enqueue job into BullMQ
    const bullJob = await (0, generation_queue_1.addGenerationJob)({
        userId,
        prompt,
        subject,
        difficulty,
        jobId: savedJobStatus._id.toString(),
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
}));
exports.default = router;

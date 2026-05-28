"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const generationJobStatus_1 = require("../models/generationJobStatus");
const asyncHandler_1 = require("../middleware/asyncHandler");
const appError_1 = require("../utils/appError");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Retrieve job status & progress for state recovery
router.get('/:id/status', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    logger_1.logger.info(`🔍 API: Fetching job status for Job ID: ${id}`);
    const job = await generationJobStatus_1.GenerationJobStatus.findById(id);
    if (!job) {
        logger_1.logger.warn(`⚠️ API Warning: Job status tracker not found for Job ID: ${id}`);
        throw new appError_1.AppError('Job status tracker not found.', 404);
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
exports.default = router;

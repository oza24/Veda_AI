"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMaterial = void 0;
const asyncHandler_1 = require("../middleware/asyncHandler");
const assignment_1 = require("../models/assignment");
const generationJobStatus_1 = require("../models/generationJobStatus");
const generation_queue_1 = require("../queues/generation.queue");
const file_extraction_service_1 = require("../services/file-extraction.service");
const appError_1 = require("../utils/appError");
const logger_1 = require("../utils/logger");
const socket_1 = require("../socket/socket");
/**
 * @desc Handle file upload, parse text asynchronously, and trigger AI assignment generation
 * @route POST /api/uploads/material
 */
exports.uploadMaterial = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const file = req.file;
    const { title, createdBy, subject, difficulty, dueDate, maxMarks, prompt, questionRows } = req.body;
    // 1. Validate mandatory fields
    if (!file) {
        throw new appError_1.AppError('File upload material is required.', 400);
    }
    if (!title || !title.trim()) {
        throw new appError_1.AppError('Assignment title is required.', 400);
    }
    if (!createdBy || !createdBy.trim()) {
        throw new appError_1.AppError('Creator identifier (createdBy) is required.', 400);
    }
    if (!subject || !subject.trim()) {
        throw new appError_1.AppError('Subject is required.', 400);
    }
    if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
        throw new appError_1.AppError("Difficulty must be one of: 'easy', 'medium', 'hard'.", 400);
    }
    logger_1.logger.info(`✨ Controller: Received uploaded material "${file.originalname}" [Size: ${file.size} bytes]`);
    // 2. Initialize Assignment document in MongoDB (status starts as draft)
    const assignment = new assignment_1.Assignment({
        title: title.trim(),
        description: `Generated from uploaded reference file: ${file.originalname}`,
        createdBy: createdBy.trim(),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status: 'draft',
        maxMarks: maxMarks ? Number(maxMarks) : 100,
        generationStatus: 'pending',
    });
    const savedAssignment = await assignment.save();
    logger_1.logger.info(`💾 Assignment draft persisted [ID: ${savedAssignment._id}]`);
    // 3. Initialize Job status tracker document in MongoDB
    const jobStatus = new generationJobStatus_1.GenerationJobStatus({
        userId: createdBy.trim(),
        prompt: prompt || `Generate questions based on reference file contents of: ${title}`,
        status: 'pending',
        progress: 0,
    });
    const savedJobStatus = await jobStatus.save();
    logger_1.logger.info(`💾 Job tracker persisted [ID: ${savedJobStatus._id}]`);
    const jobIdStr = savedJobStatus._id.toString();
    const assignmentIdStr = savedAssignment._id.toString();
    // 4. Return success response to the client immediately containing tracking IDs
    res.status(201).json({
        success: true,
        message: 'File uploaded successfully. Text extraction and AI generation initiated in the background.',
        data: {
            assignmentId: savedAssignment._id,
            jobId: savedJobStatus._id,
            filename: file.filename,
        },
    });
    // 5. Spawn background async process for text extraction and AI queue enqueuing
    (async () => {
        try {
            logger_1.logger.info(`⏳ Background: Starting text extraction for Job ID: ${jobIdStr}...`);
            // Extract text dynamically (PDF parse or Image OCR)
            const extractedText = await (0, file_extraction_service_1.extractTextFromFile)(file.path, file.mimetype, jobIdStr);
            if (!extractedText || !extractedText.trim()) {
                logger_1.logger.warn(`⚠️ Background Warning: Extracted text content for Job ID: ${jobIdStr} is completely empty!`);
                throw new Error('Reference material text extraction returned empty content. Please verify that the PDF or image file has readable text/scans.');
            }
            logger_1.logger.info(`⏳ Background: Extracted text successfully (${extractedText.length} characters). Preview of first 250 characters:\n--- PREVIEW START ---\n${extractedText.substring(0, 250)}...\n--- PREVIEW END ---`);
            // Extract and parse questionRows if present
            let parsedQuestionRows;
            if (questionRows) {
                try {
                    parsedQuestionRows = typeof questionRows === 'string' ? JSON.parse(questionRows) : questionRows;
                }
                catch (err) {
                    logger_1.logger.warn(`⚠️ Upload Controller: Failed to parse questionRows JSON: ${err.message}`);
                }
            }
            // Enqueue job into BullMQ queue carrying the extracted text payload
            await (0, generation_queue_1.addGenerationJob)({
                userId: createdBy.trim(),
                prompt: prompt || `Generate questions based on this reference material:\n\n${extractedText}`,
                subject: subject.trim(),
                difficulty: difficulty,
                jobId: jobIdStr,
                assignmentId: assignmentIdStr,
                extractedText: extractedText,
                questionRows: parsedQuestionRows,
            });
        }
        catch (error) {
            logger_1.logger.error(`💥 Background: File upload processing pipeline failed: ${error.message}`);
            // Fallback: mark job and assignment as failed
            savedJobStatus.status = 'failed';
            savedJobStatus.error = error.message;
            await savedJobStatus.save();
            savedAssignment.generationStatus = 'failed';
            await savedAssignment.save();
            (0, socket_1.emitToJobRoom)(jobIdStr, 'job:failed', { jobId: jobIdStr, error: error.message });
        }
    })();
});

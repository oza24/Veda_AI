"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeWorker = exports.initializeWorker = exports.processJob = void 0;
const bullmq_1 = require("bullmq");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const generation_queue_1 = require("../queues/generation.queue");
const generationJobStatus_1 = require("../models/generationJobStatus");
const generatedQuestionPaper_1 = require("../models/generatedQuestionPaper");
const assignment_1 = require("../models/assignment");
const socket_1 = require("../socket/socket");
const ai_generation_service_1 = require("../services/ai-generation.service");
let worker;
/**
 * Main job processor that runs asynchronously in the background
 */
const processJob = async (job) => {
    const { userId, prompt, subject, difficulty, jobId, assignmentId, extractedText, questionRows } = job.data;
    logger_1.logger.info(`🔨 Processing AI Question Generation job #${job.id} for user ${userId} [JobRef: ${jobId}, HasText: ${!!extractedText}]`);
    // 1. Fetch Job status tracker document in MongoDB
    const jobStatus = await generationJobStatus_1.GenerationJobStatus.findById(jobId);
    if (!jobStatus) {
        throw new Error(`GenerationJobStatus document not found for ID: ${jobId}`);
    }
    // Fetch Assignment if linked
    const assignment = assignmentId ? await assignment_1.Assignment.findById(assignmentId) : null;
    try {
        // 2. Transition state to 'processing' and 10% progress
        jobStatus.status = 'processing';
        jobStatus.progress = 10;
        await jobStatus.save();
        if (assignment) {
            assignment.generationStatus = 'processing';
            await assignment.save();
        }
        await job.updateProgress(10);
        logger_1.logger.info(`🔄 Job #${job.id} state updated to: processing (10%)`);
        (0, socket_1.emitToJobRoom)(jobId, 'job:started', { jobId, progress: 10 });
        // 3. OpenAI Prompt engineering stage (Now Gemini integration)
        jobStatus.progress = 30;
        await jobStatus.save();
        await job.updateProgress(30);
        logger_1.logger.info(`🔄 Job #${job.id} state updated to: generating prompt (30%)`);
        (0, socket_1.emitToJobRoom)(jobId, 'job:progress', { jobId, progress: 30 });
        // 4. Request paper generation from Groq Llama 3
        jobStatus.progress = 60;
        await jobStatus.save();
        await job.updateProgress(60);
        logger_1.logger.info(`🔄 Job #${job.id} state updated to: generating paper via Groq Llama 3 (60%)`);
        (0, socket_1.emitToJobRoom)(jobId, 'job:progress', { jobId, progress: 60 });
        const groqResponse = await (0, ai_generation_service_1.generateQuestionPaper)(subject, difficulty, prompt, 'Grade 10', extractedText, questionRows);
        // 5. Map the sectioned questions returned from Llama
        const mappedSections = groqResponse.sections.map(section => ({
            title: section.title || 'Section',
            instruction: section.instruction || '',
            type: (0, ai_generation_service_1.normalizeQuestionType)(section.questions[0]?.type || 'short_answer'),
            questions: section.questions.map(q => {
                const qType = (0, ai_generation_service_1.normalizeQuestionType)(q.type);
                return {
                    text: q.question,
                    type: qType,
                    options: qType === 'multiple_choice' ? (q.options || ['Option A', 'Option B', 'Option C', 'Option D']) : undefined,
                    correctAnswer: q.correctAnswer,
                    marks: q.marks || 2,
                };
            })
        }));
        // Generate flat questions array for backwards compatibility
        const flatQuestions = mappedSections.flatMap(section => section.questions);
        // 6. Save live Generated Question Paper to MongoDB
        const generatedPaper = new generatedQuestionPaper_1.GeneratedQuestionPaper({
            title: assignment ? `${assignment.title} - AI Exam Paper` : `Generated ${subject} Exam - ${difficulty.toUpperCase()}`,
            subject,
            gradeLevel: 'Grade 10',
            syllabus: 'Curriculum standard v1',
            difficulty,
            sections: mappedSections,
            questions: flatQuestions,
            createdBy: userId,
            jobId: jobStatus._id,
            metadata: {
                promptUsed: prompt,
                generatedAt: new Date().toISOString(),
                engineUsed: 'groq-llama-3.3-70b-versatile',
                sectionsReceived: groqResponse.sections.length,
            },
        });
        const savedPaper = await generatedPaper.save();
        logger_1.logger.info(`📝 Live GeneratedQuestionPaper saved successfully [PaperID: ${savedPaper._id}]`);
        // 7. Complete job - Associate paper and transition status to 'completed'
        jobStatus.resultPaperId = savedPaper._id;
        jobStatus.status = 'completed';
        jobStatus.progress = 100;
        await jobStatus.save();
        if (assignment) {
            assignment.questionPaper = savedPaper._id;
            assignment.generationStatus = 'completed';
            assignment.status = 'published'; // Auto publish once generated
            await assignment.save();
            logger_1.logger.info(`🔗 Linked generated paper to Assignment ${assignment._id}`);
        }
        await job.updateProgress(100);
        logger_1.logger.info(`✅ Job #${job.id} completed successfully for user ${userId}! [JobRef: ${jobId}]`);
        (0, socket_1.emitToJobRoom)(jobId, 'job:completed', { jobId, progress: 100, paperId: savedPaper._id });
        return { paperId: savedPaper._id };
    }
    catch (error) {
        logger_1.logger.error(`💥 Job #${job.id} processing failed: ${error.message}`, error);
        // Fallback: update status to failed in database
        jobStatus.status = 'failed';
        jobStatus.error = error.message;
        await jobStatus.save();
        if (assignment) {
            assignment.generationStatus = 'failed';
            await assignment.save();
        }
        (0, socket_1.emitToJobRoom)(jobId, 'job:failed', { jobId, error: error.message });
        throw error; // Let BullMQ know the job failed
    }
};
exports.processJob = processJob;
/**
 * Initialize background BullMQ Worker
 */
const initializeWorker = () => {
    const connection = {
        host: env_1.env.REDIS_HOST,
        port: env_1.env.REDIS_PORT,
        maxRetriesPerRequest: null,
    };
    worker = new bullmq_1.Worker(generation_queue_1.QUEUE_NAME, exports.processJob, {
        connection,
        concurrency: 2, // Process up to 2 papers concurrently
    });
    worker.on('active', (job) => {
        logger_1.logger.info(`🏃 Worker active: Job #${job.id} has started processing.`);
    });
    worker.on('completed', (job, result) => {
        logger_1.logger.info(`✨ Worker completed: Job #${job.id} finished successfully. Result: ${JSON.stringify(result)}`);
    });
    worker.on('failed', (job, err) => {
        logger_1.logger.error(`🚨 Worker failed: Job #${job?.id} failed with error: ${err.message}`, err);
    });
};
exports.initializeWorker = initializeWorker;
/**
 * Gracefully close background Worker
 */
const closeWorker = async () => {
    if (worker) {
        logger_1.logger.info('🔌 Shutting down background BullMQ Worker gracefully...');
        await worker.close();
        logger_1.logger.info('✅ BullMQ Worker closed.');
    }
};
exports.closeWorker = closeWorker;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssignmentPaper = exports.getAssignmentById = exports.getAssignments = exports.createAssignment = void 0;
const assignment_1 = require("../models/assignment");
const generationJobStatus_1 = require("../models/generationJobStatus");
const generatedQuestionPaper_1 = require("../models/generatedQuestionPaper");
const generation_queue_1 = require("../queues/generation.queue");
const appError_1 = require("../utils/appError");
const logger_1 = require("../utils/logger");
/**
 * Create a new Assignment and trigger the background AI question paper generation job
 */
const createAssignment = async (data) => {
    logger_1.logger.info(`✨ Service: Creating assignment "${data.title}" for subject "${data.subject}"`);
    // 1. Create the Assignment tracking document in MongoDB (status starts as draft)
    const assignment = new assignment_1.Assignment({
        title: data.title,
        description: data.description,
        createdBy: data.createdBy,
        dueDate: data.dueDate,
        status: 'draft',
        maxMarks: data.maxMarks || 100,
        generationStatus: 'pending',
    });
    const savedAssignment = await assignment.save();
    logger_1.logger.info(`💾 Assignment persisted in database [ID: ${savedAssignment._id}]`);
    // 2. Create the Generation Job tracking document in MongoDB
    const jobStatus = new generationJobStatus_1.GenerationJobStatus({
        userId: data.createdBy,
        prompt: data.prompt,
        status: 'pending',
        progress: 0,
    });
    const savedJobStatus = await jobStatus.save();
    logger_1.logger.info(`💾 Job tracker persisted in database [ID: ${savedJobStatus._id}]`);
    // 3. Push the generation task to BullMQ
    const bullJob = await (0, generation_queue_1.addGenerationJob)({
        userId: data.createdBy,
        prompt: data.prompt,
        subject: data.subject,
        difficulty: data.difficulty,
        jobId: savedJobStatus._id.toString(),
        assignmentId: savedAssignment._id.toString(),
        questionRows: data.questionRows,
    });
    logger_1.logger.info(`🚀 Async generation job #${bullJob.id} enqueued for assignment ${savedAssignment._id}`);
    return {
        assignment: savedAssignment,
        job: savedJobStatus,
    };
};
exports.createAssignment = createAssignment;
/**
 * Get all assignments, optionally filtered by teacher ID
 */
const getAssignments = async (teacherId) => {
    const query = teacherId ? { createdBy: teacherId } : {};
    return await assignment_1.Assignment.find(query).sort({ createdAt: -1 });
};
exports.getAssignments = getAssignments;
/**
 * Get a specific assignment by ID
 */
const getAssignmentById = async (id) => {
    const assignment = await assignment_1.Assignment.findById(id);
    if (!assignment) {
        throw new appError_1.AppError(`Assignment not found for ID: ${id}`, 404);
    }
    return assignment;
};
exports.getAssignmentById = getAssignmentById;
/**
 * Get the generated question paper linked to an assignment
 */
const getAssignmentPaper = async (id) => {
    const assignment = await (0, exports.getAssignmentById)(id);
    if (assignment.generationStatus === 'pending' || assignment.generationStatus === 'processing') {
        throw new appError_1.AppError('The AI question paper for this assignment is still generating. Please try again in a few moments.', 400);
    }
    if (assignment.generationStatus === 'failed') {
        throw new appError_1.AppError('The AI question paper generation for this assignment failed. Please retry generation or create a new assignment.', 424);
    }
    if (!assignment.questionPaper) {
        throw new appError_1.AppError('No question paper is currently linked to this assignment.', 404);
    }
    const paper = await generatedQuestionPaper_1.GeneratedQuestionPaper.findById(assignment.questionPaper);
    if (!paper) {
        throw new appError_1.AppError('The linked question paper could not be found in the database.', 404);
    }
    return paper;
};
exports.getAssignmentPaper = getAssignmentPaper;

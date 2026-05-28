"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssignmentPaper = exports.getAssignmentById = exports.getAssignments = exports.createAssignment = void 0;
const asyncHandler_1 = require("../middleware/asyncHandler");
const assignmentService = __importStar(require("../services/assignment.service"));
const appError_1 = require("../utils/appError");
const logger_1 = require("../utils/logger");
/**
 * @desc Create new Assignment and enqueue background AI paper generation
 * @route POST /api/assignments
 */
exports.createAssignment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { title, description, createdBy, prompt, subject, difficulty, dueDate, maxMarks, questionRows } = req.body;
    // 1. Rigorous request parameter validation
    if (!title || !title.trim()) {
        throw new appError_1.AppError('Assignment title is required and cannot be empty.', 400);
    }
    if (!createdBy || !createdBy.trim()) {
        throw new appError_1.AppError('Creator identifier (createdBy) is required.', 400);
    }
    if (!prompt || !prompt.trim()) {
        throw new appError_1.AppError('AI Prompt guidelines are required for generation.', 400);
    }
    if (!subject || !subject.trim()) {
        throw new appError_1.AppError('Subject is required.', 400);
    }
    if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
        throw new appError_1.AppError("Difficulty must be one of: 'easy', 'medium', 'hard'.", 400);
    }
    // 2. Map input properties
    const input = {
        title: title.trim(),
        description: description?.trim(),
        createdBy: createdBy.trim(),
        prompt: prompt.trim(),
        subject: subject.trim(),
        difficulty: difficulty,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        maxMarks: maxMarks ? Number(maxMarks) : undefined,
        questionRows: questionRows,
    };
    // 3. Delegate to service layer
    const result = await assignmentService.createAssignment(input);
    // 4. Return immediately containing tracking references
    res.status(201).json({
        success: true,
        message: 'Assignment created successfully. AI exam paper generation initiated.',
        data: {
            assignmentId: result.assignment._id,
            jobId: result.job._id,
            status: result.assignment.generationStatus,
        },
    });
});
/**
 * @desc Retrieve all assignments
 * @route GET /api/assignments
 */
exports.getAssignments = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Option to filter assignments by specific teacher ID
    const teacherId = req.query.teacherId;
    logger_1.logger.info(`✨ Controller: Fetching assignments (filter: teacherId=${teacherId})`);
    const assignments = await assignmentService.getAssignments(teacherId);
    res.status(200).json({
        success: true,
        count: assignments.length,
        data: assignments,
    });
});
/**
 * @desc Get specific Assignment details
 * @route GET /api/assignments/:id
 */
exports.getAssignmentById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new appError_1.AppError('Assignment ID is required.', 400);
    }
    logger_1.logger.info(`✨ Controller: Fetching assignment ID: ${id}`);
    const assignment = await assignmentService.getAssignmentById(id);
    res.status(200).json({
        success: true,
        data: assignment,
    });
});
/**
 * @desc Get the AI-generated exam paper linked to an Assignment
 * @route GET /api/assignments/:id/paper
 */
exports.getAssignmentPaper = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new appError_1.AppError('Assignment ID is required.', 400);
    }
    logger_1.logger.info(`✨ Controller: Fetching generated exam paper for assignment ID: ${id}`);
    const paper = await assignmentService.getAssignmentPaper(id);
    res.status(200).json({
        success: true,
        data: paper,
    });
});

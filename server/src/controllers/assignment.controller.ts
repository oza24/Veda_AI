import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as assignmentService from '../services/assignment.service';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

/**
 * @desc Create new Assignment and enqueue background AI paper generation
 * @route POST /api/assignments
 */
export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, createdBy, prompt, subject, difficulty, dueDate, maxMarks, questionRows } = req.body;

  // 1. Rigorous request parameter validation
  if (!title || !title.trim()) {
    throw new AppError('Assignment title is required and cannot be empty.', 400);
  }
  if (!createdBy || !createdBy.trim()) {
    throw new AppError('Creator identifier (createdBy) is required.', 400);
  }
  if (!prompt || !prompt.trim()) {
    throw new AppError('AI Prompt guidelines are required for generation.', 400);
  }
  if (!subject || !subject.trim()) {
    throw new AppError('Subject is required.', 400);
  }
  if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new AppError("Difficulty must be one of: 'easy', 'medium', 'hard'.", 400);
  }

  // 2. Map input properties
  const input: assignmentService.CreateAssignmentInput = {
    title: title.trim(),
    description: description?.trim(),
    createdBy: createdBy.trim(),
    prompt: prompt.trim(),
    subject: subject.trim(),
    difficulty: difficulty as any,
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
export const getAssignments = asyncHandler(async (req: Request, res: Response) => {
  // Option to filter assignments by specific teacher ID
  const teacherId = req.query.teacherId as string | undefined;
  
  logger.info(`✨ Controller: Fetching assignments (filter: teacherId=${teacherId})`);
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
export const getAssignmentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw new AppError('Assignment ID is required.', 400);
  }

  logger.info(`✨ Controller: Fetching assignment ID: ${id}`);
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
export const getAssignmentPaper = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError('Assignment ID is required.', 400);
  }

  logger.info(`✨ Controller: Fetching generated exam paper for assignment ID: ${id}`);
  const paper = await assignmentService.getAssignmentPaper(id);

  res.status(200).json({
    success: true,
    data: paper,
  });
});

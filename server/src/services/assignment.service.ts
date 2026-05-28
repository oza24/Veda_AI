import { Assignment, IAssignment } from '../models/assignment';
import { GenerationJobStatus } from '../models/generationJobStatus';
import { GeneratedQuestionPaper } from '../models/generatedQuestionPaper';
import { addGenerationJob } from '../queues/generation.queue';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export interface CreateAssignmentInput {
  title: string;
  description?: string;
  createdBy: string; // Teacher user ID
  prompt: string;    // AI generation instructions
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  dueDate?: Date;
  maxMarks?: number;
  questionRows?: any[];
}

/**
 * Create a new Assignment and trigger the background AI question paper generation job
 */
export const createAssignment = async (data: CreateAssignmentInput) => {
  logger.info(`✨ Service: Creating assignment "${data.title}" for subject "${data.subject}"`);

  // 1. Create the Assignment tracking document in MongoDB (status starts as draft)
  const assignment = new Assignment({
    title: data.title,
    description: data.description,
    createdBy: data.createdBy,
    dueDate: data.dueDate,
    status: 'draft',
    maxMarks: data.maxMarks || 100,
    generationStatus: 'pending',
  });

  const savedAssignment = await assignment.save();
  logger.info(`💾 Assignment persisted in database [ID: ${savedAssignment._id}]`);

  // 2. Create the Generation Job tracking document in MongoDB
  const jobStatus = new GenerationJobStatus({
    userId: data.createdBy,
    prompt: data.prompt,
    status: 'pending',
    progress: 0,
  });

  const savedJobStatus = await jobStatus.save();
  logger.info(`💾 Job tracker persisted in database [ID: ${savedJobStatus._id}]`);

  // 3. Push the generation task to BullMQ
  const bullJob = await addGenerationJob({
    userId: data.createdBy,
    prompt: data.prompt,
    subject: data.subject,
    difficulty: data.difficulty,
    jobId: (savedJobStatus._id as any).toString(),
    assignmentId: (savedAssignment._id as any).toString(),
    questionRows: data.questionRows,
  });

  logger.info(`🚀 Async generation job #${bullJob.id} enqueued for assignment ${savedAssignment._id}`);

  return {
    assignment: savedAssignment,
    job: savedJobStatus,
  };
};

/**
 * Get all assignments, optionally filtered by teacher ID
 */
export const getAssignments = async (teacherId?: string): Promise<IAssignment[]> => {
  const query = teacherId ? { createdBy: teacherId } : {};
  return await Assignment.find(query).sort({ createdAt: -1 });
};

/**
 * Get a specific assignment by ID
 */
export const getAssignmentById = async (id: string): Promise<IAssignment> => {
  const assignment = await Assignment.findById(id);
  if (!assignment) {
    throw new AppError(`Assignment not found for ID: ${id}`, 404);
  }
  return assignment;
};

/**
 * Get the generated question paper linked to an assignment
 */
export const getAssignmentPaper = async (id: string) => {
  const assignment = await getAssignmentById(id);

  if (assignment.generationStatus === 'pending' || assignment.generationStatus === 'processing') {
    throw new AppError('The AI question paper for this assignment is still generating. Please try again in a few moments.', 400);
  }

  if (assignment.generationStatus === 'failed') {
    throw new AppError('The AI question paper generation for this assignment failed. Please retry generation or create a new assignment.', 424);
  }

  if (!assignment.questionPaper) {
    throw new AppError('No question paper is currently linked to this assignment.', 404);
  }

  const paper = await GeneratedQuestionPaper.findById(assignment.questionPaper);
  if (!paper) {
    throw new AppError('The linked question paper could not be found in the database.', 404);
  }

  return paper;
};

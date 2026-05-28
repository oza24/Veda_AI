import { Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { QUEUE_NAME, GenerationJobPayload } from '../queues/generation.queue';
import { GenerationJobStatus } from '../models/generationJobStatus';
import { GeneratedQuestionPaper } from '../models/generatedQuestionPaper';
import { Assignment } from '../models/assignment';
import { emitToJobRoom } from '../socket/socket';
import { generateQuestionPaper, normalizeQuestionType } from '../services/ai-generation.service';

let worker: Worker<GenerationJobPayload>;


/**
 * Main job processor that runs asynchronously in the background
 */
export const processJob = async (job: Job<GenerationJobPayload>) => {
  const { userId, prompt, subject, difficulty, jobId, assignmentId, extractedText, questionRows } = job.data;
  logger.info(`🔨 Processing AI Question Generation job #${job.id} for user ${userId} [JobRef: ${jobId}, HasText: ${!!extractedText}]`);

  // 1. Fetch Job status tracker document in MongoDB
  const jobStatus = await GenerationJobStatus.findById(jobId);
  if (!jobStatus) {
    throw new Error(`GenerationJobStatus document not found for ID: ${jobId}`);
  }

  // Fetch Assignment if linked
  const assignment = assignmentId ? await Assignment.findById(assignmentId) : null;

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
    logger.info(`🔄 Job #${job.id} state updated to: processing (10%)`);
    emitToJobRoom(jobId, 'job:started', { jobId, progress: 10 });

    // 3. OpenAI Prompt engineering stage (Now Gemini integration)
    jobStatus.progress = 30;
    await jobStatus.save();
    await job.updateProgress(30);
    logger.info(`🔄 Job #${job.id} state updated to: generating prompt (30%)`);
    emitToJobRoom(jobId, 'job:progress', { jobId, progress: 30 });

    // 4. Request paper generation from Groq Llama 3
    jobStatus.progress = 60;
    await jobStatus.save();
    await job.updateProgress(60);
    logger.info(`🔄 Job #${job.id} state updated to: generating paper via Groq Llama 3 (60%)`);
    emitToJobRoom(jobId, 'job:progress', { jobId, progress: 60 });

    const groqResponse = await generateQuestionPaper(subject, difficulty, prompt, 'Grade 10', extractedText, questionRows);

    // 5. Map the sectioned questions returned from Llama
    const mappedSections = groqResponse.sections.map(section => ({
      title: section.title || 'Section',
      instruction: section.instruction || '',
      type: normalizeQuestionType(section.questions[0]?.type || 'short_answer') as any,
      questions: section.questions.map(q => {
        const qType = normalizeQuestionType(q.type);
        return {
          text: q.question,
          type: qType as any,
          options: qType === 'multiple_choice' ? (q.options || ['Option A', 'Option B', 'Option C', 'Option D']) : undefined,
          correctAnswer: q.correctAnswer,
          marks: q.marks || 2,
        };
      })
    }));

    // Generate flat questions array for backwards compatibility
    const flatQuestions = mappedSections.flatMap(section => section.questions);

    // 6. Save live Generated Question Paper to MongoDB
    const generatedPaper = new GeneratedQuestionPaper({
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
    logger.info(`📝 Live GeneratedQuestionPaper saved successfully [PaperID: ${savedPaper._id}]`);

    // 7. Complete job - Associate paper and transition status to 'completed'
    jobStatus.resultPaperId = savedPaper._id as any;
    jobStatus.status = 'completed';
    jobStatus.progress = 100;
    await jobStatus.save();

    if (assignment) {
      assignment.questionPaper = savedPaper._id as any;
      assignment.generationStatus = 'completed';
      assignment.status = 'published'; // Auto publish once generated
      await assignment.save();
      logger.info(`🔗 Linked generated paper to Assignment ${assignment._id}`);
    }

    await job.updateProgress(100);

    logger.info(`✅ Job #${job.id} completed successfully for user ${userId}! [JobRef: ${jobId}]`);
    emitToJobRoom(jobId, 'job:completed', { jobId, progress: 100, paperId: savedPaper._id });
    return { paperId: savedPaper._id };
  } catch (error: any) {
    logger.error(`💥 Job #${job.id} processing failed: ${error.message}`, error);
    
    // Check if it's a rate limit error to display user-friendly message
    const errorMessage = error.name === 'RateLimitError' || error.message.includes('quota exhausted') 
      ? 'Daily AI quota exhausted. Please retry later.' 
      : error.message;

    // Fallback: update status to failed in database
    jobStatus.status = 'failed';
    jobStatus.error = errorMessage;
    await jobStatus.save();

    if (assignment) {
      assignment.generationStatus = 'failed';
      await assignment.save();
    }
    
    emitToJobRoom(jobId, 'job:failed', { jobId, error: errorMessage });
    throw error; // Let BullMQ know the job failed
  }
};

/**
 * Initialize background BullMQ Worker
 */
export const initializeWorker = (): void => {
  const connection = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    maxRetriesPerRequest: null,
  };

  worker = new Worker<GenerationJobPayload>(QUEUE_NAME, processJob, {
    connection,
    concurrency: 2, // Process up to 2 papers concurrently
  });

  worker.on('active', (job) => {
    logger.info(`🏃 Worker active: Job #${job.id} has started processing.`);
  });

  worker.on('completed', (job, result) => {
    logger.info(`✨ Worker completed: Job #${job.id} finished successfully. Result: ${JSON.stringify(result)}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`🚨 Worker failed: Job #${job?.id} failed with error: ${err.message}`, err);
  });
};

/**
 * Gracefully close background Worker
 */
export const closeWorker = async (): Promise<void> => {
  if (worker) {
    logger.info('🔌 Shutting down background BullMQ Worker gracefully...');
    await worker.close();
    logger.info('✅ BullMQ Worker closed.');
  }
};

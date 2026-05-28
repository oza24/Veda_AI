import mongoose, { Schema, Document } from 'mongoose';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IGenerationJobStatus extends Document {
  userId: string;
  prompt: string;
  status: JobStatus;
  resultPaperId?: mongoose.Types.ObjectId; // Ref to 'GeneratedQuestionPaper' once completed
  error?: string;
  progress: number; // 0 to 100
  createdAt: Date;
  updatedAt: Date;
}

const GenerationJobStatusSchema = new Schema<IGenerationJobStatus>(
  {
    userId: {
      type: String,
      required: [true, 'User identifier is required'],
      index: true,
    },
    prompt: {
      type: String,
      required: [true, 'Prompt description is required'],
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['pending', 'processing', 'completed', 'failed'],
        message: 'Invalid job status: {VALUE}',
      },
      default: 'pending',
      index: true,
    },
    resultPaperId: {
      type: Schema.Types.ObjectId,
      ref: 'GeneratedQuestionPaper',
      index: true,
    },
    error: {
      type: String,
      trim: true,
    },
    progress: {
      type: Number,
      required: true,
      min: [0, 'Progress cannot be less than 0'],
      max: [100, 'Progress cannot be more than 100'],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index to automatically fetch active processing jobs for a user
GenerationJobStatusSchema.index({ userId: 1, status: 1 });

export const GenerationJobStatus = mongoose.model<IGenerationJobStatus>(
  'GenerationJobStatus',
  GenerationJobStatusSchema
);

import mongoose, { Schema, Document } from 'mongoose';

export type AssignmentStatus = 'draft' | 'published' | 'closed';

export interface IAssignment extends Document {
  title: string;
  description?: string;
  createdBy: string; // Teacher user identifier
  questionPaper?: mongoose.Types.ObjectId; // Ref to 'GeneratedQuestionPaper'
  dueDate?: Date;
  status: AssignmentStatus;
  maxMarks: number;
  generationStatus: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: String,
      required: [true, 'Teacher identifier is required'],
      index: true,
    },
    questionPaper: {
      type: Schema.Types.ObjectId,
      ref: 'GeneratedQuestionPaper',
      index: true,
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function (this: IAssignment, val: Date) {
          // If dueDate is set, it should ideally be in the future (at least during creation, but let's keep validation flexible to allow updating past deadlines)
          return !val || val instanceof Date;
        },
        message: 'Invalid due date format',
      },
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['draft', 'published', 'closed'],
        message: 'Invalid assignment status: {VALUE}',
      },
      default: 'draft',
      index: true,
    },
    maxMarks: {
      type: Number,
      required: [true, 'Max marks are required'],
      min: [1, 'Max marks must be at least 1'],
      default: 100,
    },
    generationStatus: {
      type: String,
      enum: {
        values: ['idle', 'pending', 'processing', 'completed', 'failed'],
        message: 'Invalid assignment generation status: {VALUE}',
      },
      default: 'idle',
      index: true,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to speed up querying a teacher's published assignments
AssignmentSchema.index({ createdBy: 1, status: 1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);

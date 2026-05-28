import mongoose, { Schema, Document } from 'mongoose';

export type QuestionType = 'multiple_choice' | 'short_answer' | 'long_answer' | 'true_false';
export type PaperDifficulty = 'easy' | 'medium' | 'hard';

export interface IQuestion {
  text: string;
  type: QuestionType;
  options?: string[]; // Required only for multiple_choice
  correctAnswer?: string;
  explanation?: string;
  marks: number;
}

export interface ISection {
  title: string;
  instruction?: string;
  type: QuestionType;
  questions: IQuestion[];
}

export interface IGeneratedQuestionPaper extends Document {
  title: string;
  subject: string;
  gradeLevel?: string;
  syllabus?: string;
  difficulty: PaperDifficulty;
  sections?: ISection[]; // New dynamic sections array
  questions?: IQuestion[]; // Kept for backwards compatibility
  createdBy: string; // Refers to the User (can be Mongo ID or external auth system ID)
  jobId?: mongoose.Types.ObjectId; // Refers to the GenerationJobStatus
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Question type is required'],
      enum: {
        values: ['multiple_choice', 'short_answer', 'long_answer', 'true_false'],
        message: 'Invalid question type: {VALUE}',
      },
    },
    options: {
      type: [String],
      validate: {
        validator: function (this: IQuestion, val: string[]) {
          // If type is MCQ, we should ideally have at least 2 options
          if (this.type === 'multiple_choice') {
            return Array.isArray(val) && val.length >= 2;
          }
          return true;
        },
        message: 'Multiple choice questions must have at least 2 options',
      },
    },
    correctAnswer: {
      type: String,
      trim: true,
    },
    explanation: {
      type: String,
      trim: true,
    },
    marks: {
      type: Number,
      required: [true, 'Marks is required'],
      min: [1, 'Marks must be at least 1'],
    },
  },
  { _id: false } // No need for individual IDs for nested subdocument questions unless required
);

const SectionSchema = new Schema<ISection>(
  {
    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
    },
    instruction: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Section type is required'],
      enum: {
        values: ['multiple_choice', 'short_answer', 'long_answer', 'true_false'],
        message: 'Invalid section type: {VALUE}',
      },
    },
    questions: {
      type: [QuestionSchema],
      required: [true, 'Questions list is required for a section'],
      validate: {
        validator: (val: IQuestion[]) => Array.isArray(val) && val.length > 0,
        message: 'A section must have at least 1 question',
      },
    },
  },
  { _id: false }
);

const GeneratedQuestionPaperSchema = new Schema<IGeneratedQuestionPaper>(
  {
    title: {
      type: String,
      required: [true, 'Question paper title is required'],
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true,
    },
    gradeLevel: {
      type: String,
      trim: true,
    },
    syllabus: {
      type: String,
      trim: true,
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty level is required'],
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'Invalid difficulty level: {VALUE}',
      },
      index: true,
    },
    sections: {
      type: [SectionSchema],
      default: undefined,
    },
    questions: {
      type: [QuestionSchema],
      default: undefined,
    },
    createdBy: {
      type: String,
      required: [true, 'CreatedBy user identifier is required'],
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'GenerationJobStatus',
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

// Compound index for super fast queries on specific subjects created by a teacher
GeneratedQuestionPaperSchema.index({ createdBy: 1, subject: 1 });

export const GeneratedQuestionPaper = mongoose.model<IGeneratedQuestionPaper>(
  'GeneratedQuestionPaper',
  GeneratedQuestionPaperSchema
);

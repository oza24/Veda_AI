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
exports.GeneratedQuestionPaper = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const QuestionSchema = new mongoose_1.Schema({
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
            validator: function (val) {
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
}, { _id: false } // No need for individual IDs for nested subdocument questions unless required
);
const SectionSchema = new mongoose_1.Schema({
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
            validator: (val) => Array.isArray(val) && val.length > 0,
            message: 'A section must have at least 1 question',
        },
    },
}, { _id: false });
const GeneratedQuestionPaperSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'GenerationJobStatus',
        index: true,
    },
    metadata: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed,
    },
}, {
    timestamps: true,
});
// Compound index for super fast queries on specific subjects created by a teacher
GeneratedQuestionPaperSchema.index({ createdBy: 1, subject: 1 });
exports.GeneratedQuestionPaper = mongoose_1.default.model('GeneratedQuestionPaper', GeneratedQuestionPaperSchema);

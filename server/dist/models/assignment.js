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
exports.Assignment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AssignmentSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'GeneratedQuestionPaper',
        index: true,
    },
    dueDate: {
        type: Date,
        validate: {
            validator: function (val) {
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
        of: mongoose_1.Schema.Types.Mixed,
    },
}, {
    timestamps: true,
});
// Compound index to speed up querying a teacher's published assignments
AssignmentSchema.index({ createdBy: 1, status: 1 });
exports.Assignment = mongoose_1.default.model('Assignment', AssignmentSchema);

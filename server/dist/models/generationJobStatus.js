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
exports.GenerationJobStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const GenerationJobStatusSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
// Index to automatically fetch active processing jobs for a user
GenerationJobStatusSchema.index({ userId: 1, status: 1 });
exports.GenerationJobStatus = mongoose_1.default.model('GenerationJobStatus', GenerationJobStatusSchema);

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromFile = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const pdf_parser_1 = require("../utils/pdf-parser");
const ocr_1 = require("../utils/ocr");
const socket_1 = require("../socket/socket");
const logger_1 = require("../utils/logger");
const generationJobStatus_1 = require("../models/generationJobStatus");
/**
 * Route local files to matching parsers (PDF or OCR Image) and extract text, emitting realtime socket updates
 */
const extractTextFromFile = async (filePath, mimeType, jobId) => {
    logger_1.logger.info(`📂 Extraction Service: Loading file for processing [Path: ${filePath}, Mime: ${mimeType}]`);
    try {
        if (mimeType === 'application/pdf') {
            // 1. Emit start progress via websockets
            (0, socket_1.emitToJobRoom)(jobId, 'extraction:progress', { jobId, progress: 20, status: 'loading_pdf' });
            await generationJobStatus_1.GenerationJobStatus.findByIdAndUpdate(jobId, { progress: 20 });
            // 2. Read PDF buffer
            const fileBuffer = await promises_1.default.readFile(filePath);
            // 3. Emit parse progress
            (0, socket_1.emitToJobRoom)(jobId, 'extraction:progress', { jobId, progress: 50, status: 'parsing_pdf' });
            await generationJobStatus_1.GenerationJobStatus.findByIdAndUpdate(jobId, { progress: 50 });
            // 4. Extract PDF text
            const text = await (0, pdf_parser_1.extractTextFromPDF)(fileBuffer);
            // 5. Emit completed progress
            (0, socket_1.emitToJobRoom)(jobId, 'extraction:progress', { jobId, progress: 100, status: 'completed' });
            await generationJobStatus_1.GenerationJobStatus.findByIdAndUpdate(jobId, { progress: 100 });
            return text;
        }
        if (mimeType.startsWith('image/')) {
            // 1. Emit start OCR progress
            (0, socket_1.emitToJobRoom)(jobId, 'ocr:progress', { jobId, progress: 20, status: 'initializing_ocr' });
            await generationJobStatus_1.GenerationJobStatus.findByIdAndUpdate(jobId, { progress: 20 });
            // 2. Emit active processing progress
            (0, socket_1.emitToJobRoom)(jobId, 'ocr:progress', { jobId, progress: 60, status: 'running_ocr' });
            await generationJobStatus_1.GenerationJobStatus.findByIdAndUpdate(jobId, { progress: 60 });
            // 3. Extract Image text via Tesseract OCR
            const text = await (0, ocr_1.extractTextFromImage)(filePath);
            // 4. Emit completed progress
            (0, socket_1.emitToJobRoom)(jobId, 'ocr:progress', { jobId, progress: 100, status: 'completed' });
            await generationJobStatus_1.GenerationJobStatus.findByIdAndUpdate(jobId, { progress: 100 });
            return text;
        }
        throw new Error(`Unsupported file type for extraction: ${mimeType}`);
    }
    catch (error) {
        logger_1.logger.error(`💥 Extraction Service failed: ${error.message}`);
        (0, socket_1.emitToJobRoom)(jobId, 'job:failed', { jobId, error: error.message });
        throw error;
    }
};
exports.extractTextFromFile = extractTextFromFile;

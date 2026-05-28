"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromImage = void 0;
const tesseract_js_1 = require("tesseract.js");
const logger_1 = require("./logger");
/**
 * Perform Optical Character Recognition (OCR) on an image file using tesseract.js
 */
const extractTextFromImage = async (imagePath) => {
    try {
        logger_1.logger.info(`📸 OCR Engine: Starting text recognition on image: ${imagePath}`);
        // Instantiate english tesseract worker
        const worker = await (0, tesseract_js_1.createWorker)('eng');
        // Execute character recognition
        const { data: { text } } = await worker.recognize(imagePath);
        // Clean up worker process thread
        await worker.terminate();
        logger_1.logger.info(`✅ OCR Engine: Successfully recognized text. Characters count: ${text?.length || 0}`);
        return text || '';
    }
    catch (error) {
        logger_1.logger.error(`❌ OCR Engine: Character recognition failed: ${error.message}`, error);
        throw new Error(`Failed to perform OCR on image: ${error.message}`);
    }
};
exports.extractTextFromImage = extractTextFromImage;

import { createWorker } from 'tesseract.js';
import { logger } from './logger';

/**
 * Perform Optical Character Recognition (OCR) on an image file using tesseract.js
 */
export const extractTextFromImage = async (imagePath: string): Promise<string> => {
  try {
    logger.info(`📸 OCR Engine: Starting text recognition on image: ${imagePath}`);
    
    // Instantiate english tesseract worker
    const worker = await createWorker('eng');
    
    // Execute character recognition
    const { data: { text } } = await worker.recognize(imagePath);
    
    // Clean up worker process thread
    await worker.terminate();
    
    logger.info(`✅ OCR Engine: Successfully recognized text. Characters count: ${text?.length || 0}`);
    return text || '';
  } catch (error: any) {
    logger.error(`❌ OCR Engine: Character recognition failed: ${error.message}`, error);
    throw new Error(`Failed to perform OCR on image: ${error.message}`);
  }
};

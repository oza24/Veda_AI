import fs from 'fs/promises';
import { extractTextFromPDF } from '../utils/pdf-parser';
import { extractTextFromImage } from '../utils/ocr';
import { emitToJobRoom } from '../socket/socket';
import { logger } from '../utils/logger';
import { GenerationJobStatus } from '../models/generationJobStatus';

/**
 * Route local files to matching parsers (PDF or OCR Image) and extract text, emitting realtime socket updates
 */
export const extractTextFromFile = async (
  filePath: string,
  mimeType: string,
  jobId: string
): Promise<string> => {
  logger.info(`📂 Extraction Service: Loading file for processing [Path: ${filePath}, Mime: ${mimeType}]`);

  try {
    if (mimeType === 'application/pdf') {
      // 1. Emit start progress via websockets
      emitToJobRoom(jobId, 'extraction:progress', { jobId, progress: 20, status: 'loading_pdf' });
      await GenerationJobStatus.findByIdAndUpdate(jobId, { progress: 20 });
      
      // 2. Read PDF buffer
      const fileBuffer = await fs.readFile(filePath);
      
      // 3. Emit parse progress
      emitToJobRoom(jobId, 'extraction:progress', { jobId, progress: 50, status: 'parsing_pdf' });
      await GenerationJobStatus.findByIdAndUpdate(jobId, { progress: 50 });
      
      // 4. Extract PDF text
      const text = await extractTextFromPDF(fileBuffer);
      
      // 5. Emit completed progress
      emitToJobRoom(jobId, 'extraction:progress', { jobId, progress: 100, status: 'completed' });
      await GenerationJobStatus.findByIdAndUpdate(jobId, { progress: 100 });
      return text;
    } 
    
    if (mimeType.startsWith('image/')) {
      // 1. Emit start OCR progress
      emitToJobRoom(jobId, 'ocr:progress', { jobId, progress: 20, status: 'initializing_ocr' });
      await GenerationJobStatus.findByIdAndUpdate(jobId, { progress: 20 });
      
      // 2. Emit active processing progress
      emitToJobRoom(jobId, 'ocr:progress', { jobId, progress: 60, status: 'running_ocr' });
      await GenerationJobStatus.findByIdAndUpdate(jobId, { progress: 60 });
      
      // 3. Extract Image text via Tesseract OCR
      const text = await extractTextFromImage(filePath);
      
      // 4. Emit completed progress
      emitToJobRoom(jobId, 'ocr:progress', { jobId, progress: 100, status: 'completed' });
      await GenerationJobStatus.findByIdAndUpdate(jobId, { progress: 100 });
      return text;
    }

    throw new Error(`Unsupported file type for extraction: ${mimeType}`);
  } catch (error: any) {
    logger.error(`💥 Extraction Service failed: ${error.message}`);
    emitToJobRoom(jobId, 'job:failed', { jobId, error: error.message });
    throw error;
  }
};

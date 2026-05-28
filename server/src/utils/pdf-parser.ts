import { PDFParse } from 'pdf-parse';
import { logger } from './logger';

/**
 * Extract clean text content from a PDF file Buffer using pdf-parse
 */
export const extractTextFromPDF = async (pdfBuffer: Buffer): Promise<string> => {
  try {
    logger.info('📄 PDF Parser: Initiating raw text extraction...');
    logger.info(`📄 PDF Parser: Buffer length is ${pdfBuffer.length} bytes. Creating Uint8Array...`);
    
    // Convert Buffer to Uint8Array as required by pdf-parse v2
    const uint8Array = new Uint8Array(pdfBuffer);
    
    logger.info('📄 PDF Parser: Instantiating PDFParse parser...');
    const parser = new PDFParse(uint8Array);
    
    logger.info('📄 PDF Parser: Executing getText() character extraction...');
    const result = await parser.getText();
    
    const extractedText = result.text || '';
    logger.info(`✅ PDF Parser: Successfully extracted text. Characters count: ${extractedText.length}`);
    return extractedText;
  } catch (error: any) {
    logger.error(`❌ PDF Parser: Text extraction failed: ${error.message}`, error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromPDF = void 0;
const pdf_parse_1 = require("pdf-parse");
const logger_1 = require("./logger");
/**
 * Extract clean text content from a PDF file Buffer using pdf-parse
 */
const extractTextFromPDF = async (pdfBuffer) => {
    try {
        logger_1.logger.info('📄 PDF Parser: Initiating raw text extraction...');
        logger_1.logger.info(`📄 PDF Parser: Buffer length is ${pdfBuffer.length} bytes. Creating Uint8Array...`);
        // Convert Buffer to Uint8Array as required by pdf-parse v2
        const uint8Array = new Uint8Array(pdfBuffer);
        logger_1.logger.info('📄 PDF Parser: Instantiating PDFParse parser...');
        const parser = new pdf_parse_1.PDFParse(uint8Array);
        logger_1.logger.info('📄 PDF Parser: Executing getText() character extraction...');
        const result = await parser.getText();
        const extractedText = result.text || '';
        logger_1.logger.info(`✅ PDF Parser: Successfully extracted text. Characters count: ${extractedText.length}`);
        return extractedText;
    }
    catch (error) {
        logger_1.logger.error(`❌ PDF Parser: Text extraction failed: ${error.message}`, error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
};
exports.extractTextFromPDF = extractTextFromPDF;

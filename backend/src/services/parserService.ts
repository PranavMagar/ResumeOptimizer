import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { UploadResult, ParseResult } from '../types';
import { AppError } from './uploadService';

const PDF_MIME = 'application/pdf';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Extracts plain text from a PDF or DOCX buffer.
 *
 * All processing is in-memory; no text is written to disk or any persistent
 * storage (Requirement 10.2, 10.5).
 *
 * @param upload - The validated upload result from Upload_Service
 * @returns ParseResult containing the extracted plain text
 * @throws AppError (422) if the file is password-protected/encrypted
 * @throws AppError (422) if no readable text is found (e.g., scanned image PDF)
 * @throws AppError (500) for any other unexpected parse failure
 */
export async function parseFile(upload: UploadResult): Promise<ParseResult> {
  let extractedText: string;

  try {
    if (upload.mimeType === PDF_MIME) {
      const result = await pdfParse(upload.buffer);
      extractedText = result.text;
    } else if (upload.mimeType === DOCX_MIME) {
      const result = await mammoth.extractRawText({ buffer: upload.buffer });
      extractedText = result.value;
    } else {
      // Should not reach here if Upload_Service validated correctly, but guard anyway
      throw new AppError('Unsupported file type.', 400);
    }
  } catch (err) {
    // Re-throw AppErrors (e.g., unsupported type guard above) as-is
    if (err instanceof AppError) {
      throw err;
    }

    // Detect password-protected / encrypted PDF errors from pdf-parse
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (msg.includes('password') || msg.includes('encrypted')) {
        throw new AppError(
          'This file is password-protected and cannot be read.',
          422,
        );
      }
    }

    // Any other unexpected error
    throw new AppError('An error occurred while reading the file.', 500);
  }

  // Guard against empty or whitespace-only text (e.g., scanned image PDFs)
  if (!extractedText || extractedText.trim().length === 0) {
    throw new AppError(
      'No readable text was found in this file. Scanned image PDFs are not supported.',
      422,
    );
  }

  return { text: extractedText.trim() };
}

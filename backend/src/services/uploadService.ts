import { UploadResult } from '../types';
import path from 'path';

/**
 * Typed HTTP error with a statusCode property for Express error handling.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    // Restore prototype chain (required when extending built-ins in TypeScript)
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

const MAX_FILE_SIZE = 5_242_880; // 5 MB in bytes

/**
 * Validates an uploaded file's MIME type, extension, and size.
 *
 * Both the MIME type AND the file extension must match the same format
 * (PDF or DOCX) to defend against spoofed MIME types.
 *
 * @param file - The multer file object from the incoming request
 * @returns UploadResult containing the buffer, MIME type, and original filename
 * @throws AppError (400) if the file type is unsupported or the types don't match
 * @throws AppError (400) if the file exceeds the 5 MB size limit
 */
export function validateUpload(file: Express.Multer.File): UploadResult {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  // Determine whether MIME type is in the allowlist
  const expectedExtForMime = ALLOWED_MIME_TYPES[mime];

  // Both MIME type and extension must be valid AND must match the same format
  const isValidMime = expectedExtForMime !== undefined;
  const isValidExt = Object.values(ALLOWED_MIME_TYPES).includes(ext);
  const typesMatch = isValidMime && isValidExt && expectedExtForMime === ext;

  if (!typesMatch) {
    throw new AppError('Only PDF and DOCX files are accepted.', 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new AppError('File exceeds the 5 MB size limit.', 400);
  }

  return {
    buffer: file.buffer,
    mimeType: file.mimetype,
    originalName: file.originalname,
  };
}

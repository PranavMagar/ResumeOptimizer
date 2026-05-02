import { describe, it, expect } from 'vitest';
import { validateUpload, AppError } from '../../src/services/uploadService';

/**
 * Helper to build a minimal Express.Multer.File-shaped object.
 */
function makeFile(overrides: {
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
}): Express.Multer.File {
  const size = overrides.size ?? 1024;
  return {
    fieldname: 'resume',
    originalname: overrides.originalname ?? 'resume.pdf',
    encoding: '7bit',
    mimetype: overrides.mimetype ?? 'application/pdf',
    size,
    buffer: overrides.buffer ?? Buffer.alloc(size),
    stream: null as unknown as Express.Multer.File['stream'],
    destination: '',
    filename: '',
    path: '',
  };
}

const PDF_MIME = 'application/pdf';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_SIZE = 5_242_880;

describe('validateUpload', () => {
  // ── Happy paths ──────────────────────────────────────────────────────────

  it('accepts a valid PDF file', () => {
    const file = makeFile({ originalname: 'cv.pdf', mimetype: PDF_MIME, size: 1024 });
    const result = validateUpload(file);

    expect(result.mimeType).toBe(PDF_MIME);
    expect(result.originalName).toBe('cv.pdf');
    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it('accepts a valid DOCX file', () => {
    const file = makeFile({
      originalname: 'resume.docx',
      mimetype: DOCX_MIME,
      size: 2048,
    });
    const result = validateUpload(file);

    expect(result.mimeType).toBe(DOCX_MIME);
    expect(result.originalName).toBe('resume.docx');
    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it('accepts a file that is exactly 5,242,880 bytes (boundary)', () => {
    const file = makeFile({
      originalname: 'big.pdf',
      mimetype: PDF_MIME,
      size: MAX_SIZE,
    });
    expect(() => validateUpload(file)).not.toThrow();
  });

  // ── Type rejection ───────────────────────────────────────────────────────

  it('rejects an unsupported file type (.txt with text/plain MIME)', () => {
    const file = makeFile({
      originalname: 'notes.txt',
      mimetype: 'text/plain',
      size: 512,
    });

    expect(() => validateUpload(file)).toThrow(AppError);
    expect(() => validateUpload(file)).toThrow('Only PDF and DOCX files are accepted.');

    try {
      validateUpload(file);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
    }
  });

  it('rejects a spoofed MIME type (application/pdf MIME but .docx extension)', () => {
    // MIME says PDF but extension says DOCX — both must match the same format
    const file = makeFile({
      originalname: 'resume.docx',
      mimetype: PDF_MIME,
      size: 1024,
    });

    expect(() => validateUpload(file)).toThrow(AppError);
    expect(() => validateUpload(file)).toThrow('Only PDF and DOCX files are accepted.');
  });

  it('rejects a spoofed extension (application/pdf MIME but .txt extension)', () => {
    // MIME says PDF but extension is .txt
    const file = makeFile({
      originalname: 'resume.txt',
      mimetype: PDF_MIME,
      size: 1024,
    });

    expect(() => validateUpload(file)).toThrow(AppError);
    expect(() => validateUpload(file)).toThrow('Only PDF and DOCX files are accepted.');
  });

  // ── Size rejection ───────────────────────────────────────────────────────

  it('rejects a file that is 5,242,881 bytes (one byte over the limit)', () => {
    const file = makeFile({
      originalname: 'toobig.pdf',
      mimetype: PDF_MIME,
      size: MAX_SIZE + 1,
    });

    expect(() => validateUpload(file)).toThrow(AppError);
    expect(() => validateUpload(file)).toThrow('File exceeds the 5 MB size limit.');

    try {
      validateUpload(file);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
    }
  });
});

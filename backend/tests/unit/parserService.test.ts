import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../src/services/uploadService';
import { UploadResult } from '../../src/types';

// Use factory mocks so the module bodies never execute at import time.
// pdf-parse's index.js runs a file-system read when module.parent is falsy
// (a known quirk of the library), so we must intercept it before it loads.
vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

// Import the service and the mocked libraries after vi.mock declarations
import { parseFile } from '../../src/services/parserService';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const PDF_MIME = 'application/pdf';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Helper to build a minimal UploadResult for testing.
 */
function makeUpload(overrides: Partial<UploadResult> = {}): UploadResult {
  return {
    buffer: Buffer.from('fake content'),
    mimeType: PDF_MIME,
    originalName: 'resume.pdf',
    ...overrides,
  };
}

describe('parseFile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ── Happy paths ──────────────────────────────────────────────────────────

  it('returns extracted text for a valid PDF', async () => {
    vi.mocked(pdfParse).mockResolvedValue({
      text: 'known text content',
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: null,
      version: '1.10.100',
    } as Awaited<ReturnType<typeof pdfParse>>);

    const upload = makeUpload({ mimeType: PDF_MIME, originalName: 'resume.pdf' });
    const result = await parseFile(upload);

    expect(result).toEqual({ text: 'known text content' });
  });

  it('returns extracted text for a valid DOCX', async () => {
    vi.mocked(mammoth.extractRawText).mockResolvedValue({
      value: 'known text content',
      messages: [],
    });

    const upload = makeUpload({ mimeType: DOCX_MIME, originalName: 'resume.docx' });
    const result = await parseFile(upload);

    expect(result).toEqual({ text: 'known text content' });
  });

  it('trims leading/trailing whitespace from extracted text', async () => {
    vi.mocked(pdfParse).mockResolvedValue({
      text: '  trimmed content  \n',
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: null,
      version: '1.10.100',
    } as Awaited<ReturnType<typeof pdfParse>>);

    const upload = makeUpload({ mimeType: PDF_MIME });
    const result = await parseFile(upload);

    expect(result.text).toBe('trimmed content');
  });

  // ── Password-protected PDF ───────────────────────────────────────────────

  it('throws AppError 422 when pdf-parse throws an error containing "password"', async () => {
    vi.mocked(pdfParse).mockRejectedValue(new Error('PDF is password protected'));

    const upload = makeUpload({ mimeType: PDF_MIME });

    await expect(parseFile(upload)).rejects.toThrow(AppError);
    await expect(parseFile(upload)).rejects.toMatchObject({
      statusCode: 422,
      message: 'This file is password-protected and cannot be read.',
    });
  });

  it('throws AppError 422 when pdf-parse throws an error containing "encrypted"', async () => {
    vi.mocked(pdfParse).mockRejectedValue(new Error('File is encrypted'));

    const upload = makeUpload({ mimeType: PDF_MIME });

    await expect(parseFile(upload)).rejects.toThrow(AppError);
    await expect(parseFile(upload)).rejects.toMatchObject({
      statusCode: 422,
      message: 'This file is password-protected and cannot be read.',
    });
  });

  // ── Empty / image-only PDF ───────────────────────────────────────────────

  it('throws AppError 422 when PDF returns empty text (image-only PDF)', async () => {
    vi.mocked(pdfParse).mockResolvedValue({
      text: '',
      numpages: 1,
      numrender: 0,
      info: {},
      metadata: null,
      version: '1.10.100',
    } as Awaited<ReturnType<typeof pdfParse>>);

    const upload = makeUpload({ mimeType: PDF_MIME });

    await expect(parseFile(upload)).rejects.toThrow(AppError);
    await expect(parseFile(upload)).rejects.toMatchObject({
      statusCode: 422,
      message:
        'No readable text was found in this file. Scanned image PDFs are not supported.',
    });
  });

  it('throws AppError 422 when PDF returns whitespace-only text', async () => {
    vi.mocked(pdfParse).mockResolvedValue({
      text: '   \n\t  ',
      numpages: 1,
      numrender: 0,
      info: {},
      metadata: null,
      version: '1.10.100',
    } as Awaited<ReturnType<typeof pdfParse>>);

    const upload = makeUpload({ mimeType: PDF_MIME });

    await expect(parseFile(upload)).rejects.toThrow(AppError);
    await expect(parseFile(upload)).rejects.toMatchObject({
      statusCode: 422,
      message:
        'No readable text was found in this file. Scanned image PDFs are not supported.',
    });
  });

  // ── Empty DOCX ───────────────────────────────────────────────────────────

  it('throws AppError 422 when DOCX returns empty text', async () => {
    vi.mocked(mammoth.extractRawText).mockResolvedValue({
      value: '',
      messages: [],
    });

    const upload = makeUpload({ mimeType: DOCX_MIME, originalName: 'empty.docx' });

    await expect(parseFile(upload)).rejects.toThrow(AppError);
    await expect(parseFile(upload)).rejects.toMatchObject({
      statusCode: 422,
      message:
        'No readable text was found in this file. Scanned image PDFs are not supported.',
    });
  });

  it('throws AppError 422 when DOCX returns whitespace-only text', async () => {
    vi.mocked(mammoth.extractRawText).mockResolvedValue({
      value: '   \n  ',
      messages: [],
    });

    const upload = makeUpload({ mimeType: DOCX_MIME, originalName: 'blank.docx' });

    await expect(parseFile(upload)).rejects.toThrow(AppError);
    await expect(parseFile(upload)).rejects.toMatchObject({
      statusCode: 422,
      message:
        'No readable text was found in this file. Scanned image PDFs are not supported.',
    });
  });

  // ── Unexpected errors ────────────────────────────────────────────────────

  it('throws AppError 500 for unexpected pdf-parse errors', async () => {
    vi.mocked(pdfParse).mockRejectedValue(new Error('Unexpected internal error'));

    const upload = makeUpload({ mimeType: PDF_MIME });

    await expect(parseFile(upload)).rejects.toThrow(AppError);
    await expect(parseFile(upload)).rejects.toMatchObject({
      statusCode: 500,
      message: 'An error occurred while reading the file.',
    });
  });
});

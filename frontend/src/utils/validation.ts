/**
 * Client-side file validation for resume uploads.
 *
 * Mirrors the server-side rules in Upload_Service so users get
 * immediate feedback before the API call (Requirement 8.1, 8.7).
 *
 * The frontend SHALL NOT store the file or its contents in
 * browser local storage or session storage (Requirement 8.8).
 */

const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];
const MAX_FILE_SIZE = 5_242_880; // 5 MB — matches backend Upload_Service

/**
 * Validates a File object for type and size before upload.
 *
 * @param file - The File selected by the user
 * @returns null if valid, or a human-readable error message string if invalid
 */
export function validateFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const ext = name.substring(name.lastIndexOf('.'));

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return 'Only PDF and DOCX files are accepted.';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File exceeds the 5 MB size limit.';
  }

  return null;
}

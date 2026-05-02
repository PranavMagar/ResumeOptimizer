import { useRef, DragEvent, ChangeEvent } from 'react';
import { validateFile } from '../utils/validation';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

/**
 * UploadZone — drag-and-drop or click-to-browse file input.
 *
 * Accepts .pdf and .docx only. Calls validateFile() on selection and
 * emits onFileSelect(file) or onError(message) accordingly.
 * Requirement 8.1: Frontend SHALL accept PDF and DOCX, reject all others client-side.
 */
export function UploadZone({ onFileSelect, onError, disabled = false }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const error = validateFile(file);
    if (error) {
      onError(error);
    } else {
      onFileSelect(file);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected after an error
    e.target.value = '';
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  return (
    <div
      className={`upload-zone${disabled ? ' upload-zone--disabled' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload your resume — click or drag and drop a PDF or DOCX file"
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        onChange={handleChange}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        style={{ display: 'none' }}
      />
      <p className="upload-zone__text">
        Drag and drop your resume here, or{' '}
        <span className="upload-zone__link">browse files</span>
      </p>
      <p className="upload-zone__hint">PDF or DOCX, up to 5 MB</p>
    </div>
  );
}

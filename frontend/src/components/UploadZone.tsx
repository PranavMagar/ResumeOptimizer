import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { validateFile } from '../utils/validation';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function UploadZone({ onFileSelect, onError, disabled = false }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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
    e.target.value = '';
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
        transition-all duration-200 select-none
        ${isDragging
          ? 'border-violet-400 bg-violet-500/10 scale-[1.01]'
          : 'border-slate-700 bg-slate-900/60 hover:border-violet-500 hover:bg-slate-900'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
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
        className="hidden"
      />

      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-violet-500/20 flex items-center justify-center text-2xl">
          📂
        </div>
        <div>
          <p className="text-slate-200 font-medium">
            Drag and drop your resume here, or{' '}
            <span className="text-violet-400 underline underline-offset-2">browse files</span>
          </p>
          <p className="text-slate-500 text-sm mt-1">PDF or DOCX · up to 5 MB</p>
        </div>
      </div>
    </div>
  );
}

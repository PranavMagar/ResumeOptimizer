interface FilePreviewProps {
  file: File;
}

/**
 * FilePreview — displays the selected filename and human-readable file size.
 * Shown after a valid file is selected in UploadZone.
 */
export function FilePreview({ file }: FilePreviewProps) {
  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="file-preview" aria-label={`Selected file: ${file.name}`}>
      <span className="file-preview__icon" aria-hidden="true">📄</span>
      <span className="file-preview__name">{file.name}</span>
      <span className="file-preview__size">{formatSize(file.size)}</span>
    </div>
  );
}

interface FilePreviewProps {
  file: File;
}

export function FilePreview({ file }: FilePreviewProps) {
  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const isPdf = file.name.toLowerCase().endsWith('.pdf');

  return (
    <div
      className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 animate-fade-in"
      aria-label={`Selected file: ${file.name}`}
    >
      <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center text-lg flex-shrink-0">
        {isPdf ? '📄' : '📝'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-200 font-medium text-sm truncate">{file.name}</p>
        <p className="text-slate-500 text-xs">{formatSize(file.size)}</p>
      </div>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 uppercase tracking-wide">
        {isPdf ? 'PDF' : 'DOCX'}
      </span>
    </div>
  );
}

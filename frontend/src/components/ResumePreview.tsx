import { useEffect, useState } from 'react';

interface ResumePreviewProps {
  file: File;
}

/**
 * ResumePreview — renders the uploaded resume file in the left panel.
 * PDFs are shown via an <iframe>. DOCX files show a styled placeholder
 * since browsers cannot natively render DOCX.
 */
export function ResumePreview({ file }: ResumePreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 flex-shrink-0">
        <span className="text-lg">{isPdf ? '📄' : '📝'}</span>
        <span className="text-slate-300 font-medium text-sm truncate">{file.name}</span>
        <span className="ml-auto text-xs text-slate-500 uppercase tracking-wide font-semibold">
          {isPdf ? 'PDF' : 'DOCX'}
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        {isPdf && objectUrl ? (
          <iframe
            src={objectUrl}
            title="Resume preview"
            className="w-full h-full border-0 bg-white"
            aria-label="Resume document preview"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl">
              📝
            </div>
            <div>
              <p className="text-slate-300 font-semibold">DOCX Preview Unavailable</p>
              <p className="text-slate-500 text-sm mt-1">
                Browsers cannot render Word documents natively.
                <br />
                Your resume was analyzed successfully.
              </p>
            </div>
            {objectUrl && (
              <a
                href={objectUrl}
                download={file.name}
                className="text-violet-400 text-sm underline underline-offset-2 hover:text-violet-300"
              >
                Download to view
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useId, useRef } from 'react';
import { Paperclip, X } from 'lucide-react';
import { Label } from '@/components/ui';

const ACCEPT =
  'image/png,image/jpeg,image/gif,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip';

function fileNameFromUrl(url: string): string {
  try {
    return decodeURIComponent(url.split('/').pop() ?? url);
  } catch {
    return url.split('/').pop() ?? url;
  }
}

/**
 * Controlled file picker for task attachments. The parent owns both already-saved
 * attachment URLs (`existing`) and not-yet-uploaded `files`; this component only
 * renders the chips and surfaces add/remove intents.
 */
export function AttachmentField({
  existing = [],
  onRemoveExisting,
  files,
  onFilesChange,
  disabled,
}: {
  existing?: string[];
  onRemoveExisting?: (url: string) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const addFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;
    // De-dupe by name+size so re-selecting the same file is a no-op.
    const seen = new Set(files.map((f) => `${f.name}:${f.size}`));
    const next = [...files];
    for (const f of Array.from(incoming)) {
      const key = `${f.name}:${f.size}`;
      if (!seen.has(key)) {
        seen.add(key);
        next.push(f);
      }
    }
    onFilesChange(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <Label htmlFor={inputId}>Attachments</Label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        accept={ACCEPT}
        disabled={disabled}
        onChange={(e) => addFiles(e.target.files)}
        className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-600 file:mr-3 file:cursor-pointer file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200"
      />

      {(existing.length > 0 || files.length > 0) && (
        <ul className="mt-2 space-y-1">
          {existing.map((url) => (
            <li
              key={url}
              className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1 text-sm dark:bg-slate-800/60"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 truncate text-indigo-600 hover:underline"
              >
                {fileNameFromUrl(url)}
              </a>
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(url)}
                  disabled={disabled}
                  aria-label={`Remove ${fileNameFromUrl(url)}`}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
          {files.map((file, i) => (
            <li
              key={`${file.name}:${file.size}:${i}`}
              className="flex items-center gap-2 rounded-md bg-indigo-50 px-2 py-1 text-sm dark:bg-indigo-950/40"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
              <span className="flex-1 truncate text-slate-700 dark:text-slate-200">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() =>
                  onFilesChange(files.filter((_, idx) => idx !== i))
                }
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                className="rounded p-0.5 text-slate-400 hover:bg-indigo-200 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-indigo-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

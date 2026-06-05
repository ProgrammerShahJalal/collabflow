import { useState } from 'react';
import { FileText, File as FileIcon, ExternalLink, X } from 'lucide-react';
import {
  attachmentKind,
  fileNameFromUrl,
  thumbnailUrl,
} from './attachment-utils';

/**
 * Renders task attachments as a preview grid: images and first-page PDF
 * thumbnails are shown inline (via Cloudinary transforms), other file types
 * fall back to a labelled icon tile. Clicking any image opens a lightbox;
 * other types open in a new tab.
 */
export function AttachmentGallery({ urls }: { urls: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!urls.length) {
    return <p className="text-sm text-slate-400">No attachments.</p>;
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {urls.map((url) => (
          <AttachmentTile
            key={url}
            url={url}
            onPreview={() => setLightbox(url)}
          />
        ))}
      </ul>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close preview"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {attachmentKind(lightbox) === 'pdf' ? (
            <iframe
              src={lightbox}
              title={fileNameFromUrl(lightbox)}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-full max-w-4xl rounded-lg bg-white shadow-2xl"
            />
          ) : (
            <img
              src={thumbnailUrl(lightbox, 1400)}
              alt={fileNameFromUrl(lightbox)}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            />
          )}
        </div>
      )}
    </>
  );
}

function AttachmentTile({
  url,
  onPreview,
}: {
  url: string;
  onPreview: () => void;
}) {
  const kind = attachmentKind(url);
  const name = fileNameFromUrl(url);

  if (kind === 'image' || kind === 'pdf') {
    return (
      <li className="group relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onPreview}
          className="block aspect-[4/3] w-full bg-slate-50 dark:bg-slate-800"
          title={name}
        >
          <img
            src={thumbnailUrl(url)}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        </button>
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <span className="truncate text-xs text-slate-600 dark:text-slate-300" title={name}>
            {kind === 'pdf' && (
              <span className="mr-1 rounded bg-red-100 px-1 text-[10px] font-semibold uppercase text-red-700 dark:bg-red-900/40 dark:text-red-300">
                PDF
              </span>
            )}
            {name}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${name} in a new tab`}
            className="shrink-0 text-slate-400 hover:text-indigo-600"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </li>
    );
  }

  return (
    <li className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        title={name}
        className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/60"
      >
        <FileIcon className="h-8 w-8" />
      </a>
      <div className="flex items-center gap-1 px-2 py-1.5">
        <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="truncate text-xs text-slate-600 dark:text-slate-300" title={name}>
          {name}
        </span>
      </div>
    </li>
  );
}

/**
 * Helpers for rendering attachment previews. Attachments are stored as full
 * Cloudinary `secure_url`s (see uploads.controller on the API), e.g.
 * `https://res.cloudinary.com/<cloud>/image/upload/v123/collabflow/abc.jpg`.
 */

export type AttachmentKind = 'image' | 'pdf' | 'file';

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif']);

/** Lowercase file extension without the dot or any query string. */
export function fileExt(url: string): string {
  const path = url.split(/[?#]/)[0];
  const last = path.split('/').pop() ?? '';
  const dot = last.lastIndexOf('.');
  return dot === -1 ? '' : last.slice(dot + 1).toLowerCase();
}

/** Human-friendly file name decoded from the URL's last path segment. */
export function fileNameFromUrl(url: string): string {
  const last = url.split(/[?#]/)[0].split('/').pop() ?? url;
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

export function attachmentKind(url: string): AttachmentKind {
  const ext = fileExt(url);
  if (IMAGE_EXT.has(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'file';
}

const isCloudinary = (url: string) =>
  url.includes('res.cloudinary.com') && url.includes('/upload/');

/**
 * Build a transformed Cloudinary thumbnail URL. Cloudinary renders the first
 * page of PDFs (uploaded as the default `image` resource type) when asked for a
 * raster format, so we swap the extension to `.jpg` and ask for page 1.
 * Returns the original URL when it isn't a transformable Cloudinary asset.
 */
export function thumbnailUrl(url: string, width = 600): string {
  if (!isCloudinary(url)) return url;
  const kind = attachmentKind(url);
  if (kind === 'image') {
    return url.replace('/upload/', `/upload/c_fill,w_${width},q_auto,f_auto/`);
  }
  if (kind === 'pdf') {
    return url
      .replace(/\.pdf($|[?#])/i, '.jpg$1')
      .replace('/upload/', `/upload/pg_1,c_fill,w_${width},q_auto/`);
  }
  return url;
}

import { v2 as cloudinary } from 'cloudinary';

export const MAX_FILES_PER_REQUEST = 10;

/** Per-file size limit in bytes, derived from MAX_FILE_SIZE_MB (default 10MB). */
export function maxFileSizeBytes(): number {
  const mb = Number(process.env.MAX_FILE_SIZE_MB ?? 10);
  return (Number.isFinite(mb) && mb > 0 ? mb : 10) * 1024 * 1024;
}

/** Cloudinary folder all CollabFlow attachments are stored under. */
export const CLOUDINARY_FOLDER = 'collabflow';

/**
 * Configure the Cloudinary SDK from the environment. Either a single
 * CLOUDINARY_URL (cloudinary://<key>:<secret>@<cloud>) or the three discrete
 * CLOUDINARY_* variables may be supplied. Called once when UploadsModule boots.
 */
export function configureCloudinary(): void {
  if (process.env.CLOUDINARY_URL) {
    // The SDK reads CLOUDINARY_URL automatically; this just forces https URLs.
    cloudinary.config({ secure: true });
    return;
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

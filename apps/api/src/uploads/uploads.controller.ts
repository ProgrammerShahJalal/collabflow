import { Readable } from 'stream';
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { memoryStorage } from 'multer';
import {
  CLOUDINARY_FOLDER,
  MAX_FILES_PER_REQUEST,
  maxFileSizeBytes,
} from './uploads.config';

// Attachments are limited to images and common office/document formats. Anything
// else is rejected up front so we never stream unexpected binaries to storage.
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
]);

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES_PER_REQUEST, {
      // Buffer in memory, then stream to Cloudinary — there is no writable
      // local disk on the serverless runtime.
      storage: memoryStorage(),
      limits: { fileSize: maxFileSizeBytes() },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
        cb(
          new BadRequestException(`Unsupported file type: ${file.mimetype}`),
          false,
        );
      },
    }),
  )
  async upload(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) {
      throw new BadRequestException('No files were uploaded.');
    }
    return Promise.all(files.map((file) => this.toCloudinary(file)));
  }

  private toCloudinary(
    file: Express.Multer.File,
  ): Promise<{ url: string; name: string; size: number }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: CLOUDINARY_FOLDER, resource_type: 'auto' },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            return reject(
              error ?? new Error('Cloudinary upload returned no result'),
            );
          }
          resolve({
            url: result.secure_url,
            name: file.originalname,
            size: file.size,
          });
        },
      );
      Readable.from(file.buffer).pipe(stream);
    });
  }
}

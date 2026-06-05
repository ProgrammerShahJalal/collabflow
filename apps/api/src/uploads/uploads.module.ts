import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { configureCloudinary } from './uploads.config';

@Module({
  controllers: [UploadsController],
})
export class UploadsModule {
  constructor() {
    // Attachments are streamed to Cloudinary (the serverless filesystem is
    // read-only/ephemeral), so configure the SDK once at startup.
    configureCloudinary();
  }
}

import { Module } from '@nestjs/common';

import { LocalStorageAdapter, STORAGE_ADAPTER } from '@energy-audit/integrations';

import { AttachmentController } from './attachment.controller';
import { AttachmentService } from './attachment.service';

@Module({
  controllers: [AttachmentController],
  providers: [
    AttachmentService,
    {
      provide: STORAGE_ADAPTER,
      useFactory: () => new LocalStorageAdapter('./uploads', '/uploads'),
    },
  ],
  exports: [AttachmentService],
})
export class AttachmentModule {}

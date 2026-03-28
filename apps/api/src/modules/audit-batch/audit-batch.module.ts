import { Module } from '@nestjs/common';

import { AuditBatchController } from './audit-batch.controller';
import { AuditBatchService } from './audit-batch.service';

@Module({
  controllers: [AuditBatchController],
  providers: [AuditBatchService],
  exports: [AuditBatchService],
})
export class AuditBatchModule {}

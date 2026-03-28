import { Module } from '@nestjs/common';

import { NotificationModule } from '../notification/notification.module';
import { JobController } from './job.controller';
import { JobRegistry } from './job-registry';
import { JobRunner } from './job-runner';
import { OverdueScannerService } from './overdue-scanner.service';

@Module({
  imports: [NotificationModule],
  controllers: [JobController],
  providers: [JobRunner, JobRegistry, OverdueScannerService],
  exports: [JobRunner, JobRegistry, OverdueScannerService],
})
export class JobsModule {}

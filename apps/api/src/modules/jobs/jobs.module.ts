import { Module } from '@nestjs/common';

import { JobController } from './job.controller';
import { JobRegistry } from './job-registry';
import { JobRunner } from './job-runner';

@Module({
  controllers: [JobController],
  providers: [JobRunner, JobRegistry],
  exports: [JobRunner, JobRegistry],
})
export class JobsModule {}

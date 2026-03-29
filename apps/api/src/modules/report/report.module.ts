import { Module, OnModuleInit } from '@nestjs/common';

import { JobsModule } from '../jobs/jobs.module';
import { JobRunner } from '../jobs/job-runner';
import { NotificationModule } from '../notification/notification.module';
import { ReportAssemblyService } from './report-assembly.service';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportVersionService } from './report-version.service';

@Module({
  imports: [JobsModule, NotificationModule],
  controllers: [ReportController],
  providers: [ReportService, ReportAssemblyService, ReportVersionService],
  exports: [ReportService, ReportAssemblyService, ReportVersionService],
})
export class ReportModule implements OnModuleInit {
  constructor(
    private readonly jobRunner: JobRunner,
    private readonly assemblyService: ReportAssemblyService,
  ) {}

  onModuleInit() {
    this.jobRunner.registerHandler('report-generation', async (payload) => {
      const projectId = payload['projectId'] as string;
      if (!projectId) throw new Error('缺少 projectId');
      return this.assemblyService.generateReport(projectId);
    });
  }
}

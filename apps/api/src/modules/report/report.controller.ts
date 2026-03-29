import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { Roles } from '../auth/roles.decorator';
import { JobRunner } from '../jobs/job-runner';
import { ReportAssemblyService } from './report-assembly.service';
import { ReportService } from './report.service';
import { ReportVersionService } from './report-version.service';

import type { ReportListQuery } from './report.service';

@Roles('enterprise_user', 'manager')
@Controller('reports')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly assemblyService: ReportAssemblyService,
    private readonly jobRunner: JobRunner,
    private readonly versionService: ReportVersionService,
  ) {}

  @Get()
  async listReports(@Query() query: ReportListQuery) {
    return this.reportService.findAll(query);
  }

  @Get(':id')
  async getReport(@Param('id') id: string) {
    return this.reportService.findById(id);
  }

  @Post('generate/:projectId')
  async generateReport(@Param('projectId') projectId: string) {
    const job = this.jobRunner.enqueue({
      type: 'report-generation',
      data: { projectId },
    });

    return { jobId: job.id, status: job.status, message: '报告生成任务已提交' };
  }

  @Put(':id/status')
  async transitionStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.reportService.transitionStatus(id, body.status);
  }

  @Post(':id/upload')
  async uploadVersion(
    @Param('id') id: string,
    @Body() body: { fileUrl: string; versionType?: string; createdBy?: string },
  ) {
    const version = await this.versionService.createVersion(
      id,
      body.versionType ?? 'enterprise_revision',
      body.fileUrl,
      body.createdBy,
    );

    // Transition status if uploading final
    if (body.versionType === 'final') {
      await this.reportService.transitionStatus(id, 'final_uploaded');
    }

    return version;
  }

  @Get(':id/download')
  async downloadReport(@Param('id') id: string) {
    const report = await this.reportService.findById(id);
    return { report, message: '报告数据已返回，客户端可根据sections组装文档' };
  }

  @Get(':id/versions/compare')
  async compareVersions(
    @Param('id') id: string,
    @Query('v1') v1: string,
    @Query('v2') v2: string,
  ) {
    return this.versionService.compareVersions(v1, v2, id);
  }

  @Get(':id/versions/:versionId')
  async getVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.versionService.getVersion(versionId, id);
  }

  @Get(':id/versions')
  async listVersions(@Param('id') id: string) {
    return this.versionService.listVersions(id);
  }

  @Post(':id/versions/:versionId/activate')
  async activateVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.versionService.setActiveVersion(id, versionId);
  }
}

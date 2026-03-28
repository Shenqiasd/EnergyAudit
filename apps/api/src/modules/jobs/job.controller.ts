import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common';

import { Roles } from '../auth/roles.decorator';
import { JobRunner } from './job-runner';

import type { JobStatus, JobType } from './job-runner';

@Roles('manager')
@Controller('jobs')
export class JobController {
  constructor(private readonly jobRunner: JobRunner) {}

  @Post()
  async enqueue(@Body() body: { type: JobType; data?: Record<string, unknown> }) {
    if (!body.type) {
      throw new HttpException('任务类型不能为空', HttpStatus.BAD_REQUEST);
    }

    const job = this.jobRunner.enqueue({
      type: body.type,
      data: body.data ?? {},
    });

    return job;
  }

  @Get(':id')
  async getJob(@Param('id') id: string) {
    const job = this.jobRunner.getJob(id);
    if (!job) {
      throw new HttpException('任务不存在', HttpStatus.NOT_FOUND);
    }
    return job;
  }

  @Get()
  async listJobs(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.jobRunner.listJobs({
      type: type as JobType | undefined,
      status: status as JobStatus | undefined,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }

  @Post(':id/retry')
  async retryJob(@Param('id') id: string) {
    try {
      return await this.jobRunner.retryJob(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : '重试失败';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
}

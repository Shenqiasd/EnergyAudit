import { Inject, Injectable, Logger, OnModuleInit, forwardRef } from '@nestjs/common';

import { JobRunner } from './job-runner';
import { OverdueScannerService } from './overdue-scanner.service';

import type { JobHandler, JobType } from './job-runner';

@Injectable()
export class JobRegistry implements OnModuleInit {
  private readonly logger = new Logger(JobRegistry.name);

  constructor(
    @Inject(forwardRef(() => JobRunner))
    private readonly jobRunner: JobRunner,
    private readonly overdueScanner: OverdueScannerService,
  ) {}

  onModuleInit() {
    this.registerDefaults();
  }

  register(type: JobType, handler: JobHandler) {
    this.jobRunner.registerHandler(type, handler);
    this.logger.log(`已注册任务处理器: ${type}`);
  }

  dispatch(type: JobType, data: Record<string, unknown>) {
    return this.jobRunner.enqueue({ type, data });
  }

  private registerDefaults() {
    const defaultHandler = (type: string): JobHandler => {
      return async (payload: Record<string, unknown>) => {
        this.logger.log(`执行默认处理器 [${type}]: ${JSON.stringify(payload)}`);
        return { handled: true, type, timestamp: new Date().toISOString() };
      };
    };

    const defaultTypes: JobType[] = [
      'enterprise-sync',
      'report-generation',
      'batch-import',
      'batch-assignment',
    ];

    for (const type of defaultTypes) {
      this.register(type, defaultHandler(type));
    }

    // Register overdue scanner job
    this.register('overdue-scan', async () => {
      return this.overdueScanner.scanAll();
    });
  }
}

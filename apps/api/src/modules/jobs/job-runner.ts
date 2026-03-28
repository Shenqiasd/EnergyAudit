import { Injectable, Logger } from '@nestjs/common';

export type JobType = 'enterprise-sync' | 'report-generation' | 'batch-import' | 'batch-assignment';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface JobPayload {
  type: JobType;
  data: Record<string, unknown>;
}

export interface JobRecord {
  id: string;
  type: JobType;
  status: JobStatus;
  payload: Record<string, unknown>;
  result: unknown;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export type JobHandler = (payload: Record<string, unknown>) => Promise<unknown>;

@Injectable()
export class JobRunner {
  private readonly logger = new Logger(JobRunner.name);
  private readonly jobs = new Map<string, JobRecord>();
  private readonly handlers = new Map<JobType, JobHandler>();
  private concurrency = 3;
  private activeJobs = 0;
  private readonly queue: string[] = [];

  setConcurrency(concurrency: number) {
    this.concurrency = concurrency;
  }

  registerHandler(type: JobType, handler: JobHandler) {
    this.handlers.set(type, handler);
  }

  enqueue(payload: JobPayload): JobRecord {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const job: JobRecord = {
      id,
      type: payload.type,
      status: 'queued',
      payload: payload.data,
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
    };

    this.jobs.set(id, job);
    this.queue.push(id);
    this.processQueue();
    return job;
  }

  getJob(id: string): JobRecord | undefined {
    return this.jobs.get(id);
  }

  listJobs(filters?: { type?: JobType; status?: JobStatus; page?: number; pageSize?: number }) {
    let items = Array.from(this.jobs.values());

    if (filters?.type) {
      items = items.filter((j) => j.type === filters.type);
    }
    if (filters?.status) {
      items = items.filter((j) => j.status === filters.status);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const total = items.length;
    const paged = items.slice(offset, offset + pageSize);

    return { items: paged, total, page, pageSize };
  }

  async retryJob(id: string): Promise<JobRecord> {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error('任务不存在');
    }
    if (job.status !== 'failed') {
      throw new Error('只能重试失败的任务');
    }

    job.status = 'queued';
    job.error = null;
    job.result = null;
    job.startedAt = null;
    job.completedAt = null;

    this.queue.push(id);
    this.processQueue();
    return job;
  }

  private processQueue() {
    while (this.activeJobs < this.concurrency && this.queue.length > 0) {
      const jobId = this.queue.shift();
      if (!jobId) break;

      const job = this.jobs.get(jobId);
      if (!job || job.status !== 'queued') continue;

      this.activeJobs++;
      void this.executeJob(job);
    }
  }

  private async executeJob(job: JobRecord) {
    job.status = 'processing';
    job.startedAt = new Date().toISOString();

    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.status = 'failed';
      job.error = `没有注册 ${job.type} 类型的处理器`;
      job.completedAt = new Date().toISOString();
      this.activeJobs--;
      this.processQueue();
      return;
    }

    try {
      const result = await handler(job.payload);
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date().toISOString();
      this.logger.log(`任务 ${job.id} (${job.type}) 完成`);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : '未知错误';
      job.completedAt = new Date().toISOString();
      this.logger.error(`任务 ${job.id} (${job.type}) 失败: ${job.error}`);
    } finally {
      this.activeJobs--;
      this.processQueue();
    }
  }
}

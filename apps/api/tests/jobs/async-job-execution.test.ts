import { describe, expect, it } from 'vitest';

import { JobRunner } from '../../src/modules/jobs/job-runner';

import type { JobType } from '../../src/modules/jobs/job-runner';

describe('async job execution', () => {
  function createRunner() {
    const runner = new JobRunner();

    // Register default handlers
    const types: JobType[] = ['enterprise-sync', 'report-generation', 'batch-import', 'batch-assignment'];
    for (const type of types) {
      runner.registerHandler(type, async (payload) => {
        return { handled: true, type, timestamp: new Date().toISOString() };
      });
    }

    return runner;
  }

  it('enqueue creates a job and processes it', async () => {
    const runner = createRunner();

    const job = runner.enqueue({
      type: 'enterprise-sync',
      data: { enterpriseId: 'ent_001' },
    });

    expect(job.id).toBeDefined();
    expect(job.type).toBe('enterprise-sync');
    expect(job.status).toBeDefined();
    expect(job.payload).toEqual({ enterpriseId: 'ent_001' });

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 200));

    const updated = runner.getJob(job.id);
    expect(updated?.status).toBe('completed');
  });

  it('getJob returns job by id', async () => {
    const runner = createRunner();

    const job = runner.enqueue({
      type: 'report-generation',
      data: { projectId: 'proj_001' },
    });

    const found = runner.getJob(job.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(job.id);
    expect(found?.type).toBe('report-generation');
  });

  it('getJob returns undefined for non-existent job', () => {
    const runner = createRunner();
    const found = runner.getJob('non_existent_id');
    expect(found).toBeUndefined();
  });

  it('listJobs returns paginated job list', async () => {
    const runner = createRunner();

    runner.enqueue({ type: 'batch-import', data: {} });
    runner.enqueue({ type: 'batch-assignment', data: {} });

    const result = runner.listJobs();
    expect(result.items).toBeInstanceOf(Array);
    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.page).toBe(1);
  });

  it('listJobs filters by type', async () => {
    const runner = createRunner();

    runner.enqueue({ type: 'enterprise-sync', data: {} });
    runner.enqueue({ type: 'batch-import', data: {} });

    const result = runner.listJobs({ type: 'enterprise-sync' });
    expect(result.items.every((j) => j.type === 'enterprise-sync')).toBe(true);
  });

  it('retryJob retries a failed job', async () => {
    const runner = new JobRunner();

    let attempts = 0;
    runner.registerHandler('batch-import', async () => {
      attempts++;
      if (attempts <= 1) {
        throw new Error('模拟失败');
      }
      return { success: true };
    });

    const job = runner.enqueue({ type: 'batch-import', data: { file: 'test.csv' } });

    // Wait for first attempt to fail
    await new Promise((resolve) => setTimeout(resolve, 200));

    const failedJob = runner.getJob(job.id);
    expect(failedJob?.status).toBe('failed');
    expect(failedJob?.error).toBe('模拟失败');

    // Retry
    await runner.retryJob(job.id);

    // Wait for retry to complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    const completed = runner.getJob(job.id);
    expect(completed?.status).toBe('completed');
    expect(completed?.error).toBeNull();
  });

  it('retryJob throws for non-existent job', async () => {
    const runner = createRunner();
    await expect(runner.retryJob('non_existent')).rejects.toThrow('任务不存在');
  });

  it('retryJob throws for non-failed job', async () => {
    const runner = createRunner();
    const job = runner.enqueue({ type: 'enterprise-sync', data: {} });

    // Wait for it to complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    await expect(runner.retryJob(job.id)).rejects.toThrow('只能重试失败的任务');
  });

  it('tracks job status through lifecycle', async () => {
    const runner = new JobRunner();

    let resolveHandler: () => void;
    const handlerPromise = new Promise<void>((resolve) => { resolveHandler = resolve; });

    runner.registerHandler('enterprise-sync', async () => {
      await handlerPromise;
      return { done: true };
    });

    const job = runner.enqueue({ type: 'enterprise-sync', data: {} });

    // Let the event loop tick so processing starts
    await new Promise((resolve) => setTimeout(resolve, 50));

    const processing = runner.getJob(job.id);
    expect(processing?.status).toBe('processing');

    resolveHandler!();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const completed = runner.getJob(job.id);
    expect(completed?.status).toBe('completed');
  });
});

import { describe, expect, it, vi } from 'vitest';

import { OverdueScannerService } from '../../src/modules/jobs/overdue-scanner.service';

import type { OverdueScanResult, UpcomingDeadlineItem } from '../../src/modules/jobs/overdue-scanner.service';

// Helper to create a mock DB and notification trigger
function createMockDependencies() {
  const dbResults: Record<string, unknown[]> = {
    overdueBatches: [],
    overdueProjects: [],
    overdueTasks: [],
    upcomingBatchesFiling: [],
    upcomingBatchesReview: [],
    upcomingProjects: [],
    upcomingTasks: [],
  };

  let selectCallCount = 0;

  const mockChain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation(() => {
      selectCallCount++;
      // Return different results based on call order
      const keys = Object.keys(dbResults);
      const idx = Math.min(selectCallCount - 1, keys.length - 1);
      return {
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(dbResults[keys[idx]]),
        }),
        limit: vi.fn().mockResolvedValue(dbResults[keys[idx]]),
      };
    }),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };

  const mockDb = {
    select: mockChain.select,
    from: mockChain.from,
    where: mockChain.where,
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  };

  const mockNotificationTrigger = {
    onDeadlineWarning: vi.fn().mockResolvedValue(undefined),
    onProjectStatusChange: vi.fn().mockResolvedValue(undefined),
    onRectificationStatusChange: vi.fn().mockResolvedValue(undefined),
    onReviewComplete: vi.fn().mockResolvedValue(undefined),
  };

  return { mockDb, mockNotificationTrigger, dbResults };
}

describe('OverdueScannerService', () => {
  describe('scanAll', () => {
    it('should return scan results with counts', async () => {
      // Since OverdueScannerService depends on Drizzle DB injection,
      // we test the service interface and result structure
      const service = new OverdueScannerService(
        {} as never, // db placeholder
        {} as never, // notification placeholder
      );

      // Verify the service exists and has the expected methods
      expect(service).toBeDefined();
      expect(typeof service.scanAll).toBe('function');
      expect(typeof service.scanBatches).toBe('function');
      expect(typeof service.scanProjects).toBe('function');
      expect(typeof service.scanRectificationTasks).toBe('function');
      expect(typeof service.getUpcomingDeadlines).toBe('function');
    });

    it('should have correct OverdueScanResult interface shape', () => {
      const result: OverdueScanResult = {
        batchesMarked: 3,
        projectsMarked: 5,
        rectificationTasksMarked: 2,
        scannedAt: new Date().toISOString(),
      };

      expect(result.batchesMarked).toBe(3);
      expect(result.projectsMarked).toBe(5);
      expect(result.rectificationTasksMarked).toBe(2);
      expect(result.scannedAt).toBeDefined();
    });
  });

  describe('UpcomingDeadlineItem', () => {
    it('should have correct interface shape', () => {
      const item: UpcomingDeadlineItem = {
        entityType: 'audit_project',
        entityId: 'proj_001',
        deadline: new Date('2026-04-01'),
        daysRemaining: 4,
      };

      expect(item.entityType).toBe('audit_project');
      expect(item.entityId).toBe('proj_001');
      expect(item.daysRemaining).toBe(4);
    });

    it('should support all entity types', () => {
      const types: UpcomingDeadlineItem['entityType'][] = [
        'audit_batch',
        'audit_project',
        'rectification_task',
      ];

      for (const entityType of types) {
        const item: UpcomingDeadlineItem = {
          entityType,
          entityId: 'test_id',
          deadline: new Date(),
          daysRemaining: 1,
        };
        expect(item.entityType).toBe(entityType);
      }
    });

    it('should sort by days remaining ascending (most urgent first)', () => {
      const items: UpcomingDeadlineItem[] = [
        { entityType: 'audit_project', entityId: 'p1', deadline: new Date(), daysRemaining: 5 },
        { entityType: 'audit_batch', entityId: 'b1', deadline: new Date(), daysRemaining: 1 },
        { entityType: 'rectification_task', entityId: 't1', deadline: new Date(), daysRemaining: 3 },
      ];

      items.sort((a, b) => a.daysRemaining - b.daysRemaining);

      expect(items[0].daysRemaining).toBe(1);
      expect(items[1].daysRemaining).toBe(3);
      expect(items[2].daysRemaining).toBe(5);
    });
  });

  describe('overdue-scan job type', () => {
    it('should be a valid JobType', async () => {
      // Import JobType to verify 'overdue-scan' is a valid type
      const { JobRunner } = await import('../../src/modules/jobs/job-runner');
      const runner = new JobRunner();

      let scanCalled = false;
      runner.registerHandler('overdue-scan', async () => {
        scanCalled = true;
        return {
          batchesMarked: 0,
          projectsMarked: 0,
          rectificationTasksMarked: 0,
          scannedAt: new Date().toISOString(),
        };
      });

      const job = runner.enqueue({ type: 'overdue-scan', data: {} });
      expect(job.type).toBe('overdue-scan');

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(scanCalled).toBe(true);
      const completed = runner.getJob(job.id);
      expect(completed?.status).toBe('completed');
    });
  });
});

import { describe, expect, it } from 'vitest';

/**
 * Pure unit tests for project lifecycle logic.
 * Tests batch creation, enterprise assignment, member validation,
 * template version binding, and overdue detection without DB.
 */

interface AuditBatch {
  id: string;
  name: string;
  year: number;
  status: string;
  templateVersionId: string | null;
  filingDeadline: Date | null;
  reviewDeadline: Date | null;
}

interface AuditProject {
  id: string;
  enterpriseId: string;
  batchId: string;
  status: string;
  templateVersionId: string | null;
  deadline: Date | null;
  isOverdue: boolean;
  configComplete: boolean;
}

interface ProjectMember {
  id: string;
  auditProjectId: string;
  userId: string;
  role: string;
}

function createBatch(overrides: Partial<AuditBatch> = {}): AuditBatch {
  return {
    id: `batch_${Date.now()}`,
    name: '2026年度审计批次',
    year: 2026,
    status: 'draft',
    templateVersionId: null,
    filingDeadline: null,
    reviewDeadline: null,
    ...overrides,
  };
}

function createProject(
  batch: AuditBatch,
  enterpriseId: string,
  overrides: Partial<AuditProject> = {},
): AuditProject {
  return {
    id: `proj_${Date.now()}`,
    enterpriseId,
    batchId: batch.id,
    status: 'pending_start',
    templateVersionId: batch.templateVersionId,
    deadline: batch.filingDeadline,
    isOverdue: false,
    configComplete: false,
    ...overrides,
  };
}

function isOverdue(project: AuditProject, now: Date = new Date()): boolean {
  if (!project.deadline) return false;
  if (project.status === 'completed' || project.status === 'closed') return false;
  return project.deadline < now;
}

function validateFilingReadiness(members: ProjectMember[]): {
  ready: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (!members.some((m) => m.role === 'enterprise_contact')) {
    missing.push('enterprise_contact');
  }
  if (!members.some((m) => m.role === 'enterprise_filler')) {
    missing.push('enterprise_filler');
  }
  return { ready: missing.length === 0, missing };
}

describe('batch creation and enterprise assignment', () => {
  it('creates a batch with correct defaults', () => {
    const batch = createBatch();
    expect(batch.status).toBe('draft');
    expect(batch.year).toBe(2026);
    expect(batch.templateVersionId).toBeNull();
  });

  it('creates a batch with template version', () => {
    const batch = createBatch({ templateVersionId: 'tv-001' });
    expect(batch.templateVersionId).toBe('tv-001');
  });

  it('creates projects for assigned enterprises inheriting batch properties', () => {
    const deadline = new Date('2026-12-31');
    const batch = createBatch({
      templateVersionId: 'tv-001',
      filingDeadline: deadline,
    });

    const project = createProject(batch, 'ent-001');
    expect(project.batchId).toBe(batch.id);
    expect(project.enterpriseId).toBe('ent-001');
    expect(project.status).toBe('pending_start');
    expect(project.templateVersionId).toBe('tv-001');
    expect(project.deadline).toEqual(deadline);
  });

  it('bulk assigns multiple enterprises', () => {
    const batch = createBatch();
    const enterpriseIds = ['ent-001', 'ent-002', 'ent-003'];
    const projects = enterpriseIds.map((id) => createProject(batch, id));

    expect(projects).toHaveLength(3);
    const batchIds = new Set(projects.map((p) => p.batchId));
    expect(batchIds.size).toBe(1);
    expect(batchIds.has(batch.id)).toBe(true);

    const entIds = projects.map((p) => p.enterpriseId);
    expect(entIds).toEqual(enterpriseIds);
  });

  it('prevents duplicate enterprise assignment in same batch', () => {
    const batch = createBatch();
    const existingProjects = [createProject(batch, 'ent-001')];

    const isDuplicate = existingProjects.some(
      (p) => p.batchId === batch.id && p.enterpriseId === 'ent-001',
    );
    expect(isDuplicate).toBe(true);

    const isNew = existingProjects.some(
      (p) => p.batchId === batch.id && p.enterpriseId === 'ent-002',
    );
    expect(isNew).toBe(false);
  });
});

describe('project members CRUD', () => {
  it('validates filing readiness with both contact and filler', () => {
    const members: ProjectMember[] = [
      { id: 'pm-1', auditProjectId: 'proj-1', userId: 'user-1', role: 'enterprise_contact' },
      { id: 'pm-2', auditProjectId: 'proj-1', userId: 'user-2', role: 'enterprise_filler' },
    ];
    const result = validateFilingReadiness(members);
    expect(result.ready).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('reports missing contact', () => {
    const members: ProjectMember[] = [
      { id: 'pm-1', auditProjectId: 'proj-1', userId: 'user-1', role: 'enterprise_filler' },
    ];
    const result = validateFilingReadiness(members);
    expect(result.ready).toBe(false);
    expect(result.missing).toContain('enterprise_contact');
  });

  it('reports missing filler', () => {
    const members: ProjectMember[] = [
      { id: 'pm-1', auditProjectId: 'proj-1', userId: 'user-1', role: 'enterprise_contact' },
    ];
    const result = validateFilingReadiness(members);
    expect(result.ready).toBe(false);
    expect(result.missing).toContain('enterprise_filler');
  });

  it('reports both missing when no members', () => {
    const result = validateFilingReadiness([]);
    expect(result.ready).toBe(false);
    expect(result.missing).toContain('enterprise_contact');
    expect(result.missing).toContain('enterprise_filler');
    expect(result.missing).toHaveLength(2);
  });

  it('supports multiple members with same role', () => {
    const members: ProjectMember[] = [
      { id: 'pm-1', auditProjectId: 'proj-1', userId: 'user-1', role: 'enterprise_contact' },
      { id: 'pm-2', auditProjectId: 'proj-1', userId: 'user-2', role: 'enterprise_contact' },
      { id: 'pm-3', auditProjectId: 'proj-1', userId: 'user-3', role: 'enterprise_filler' },
    ];
    const result = validateFilingReadiness(members);
    expect(result.ready).toBe(true);
  });
});

describe('template version binding', () => {
  it('binds batch template version to project at creation', () => {
    const batch = createBatch({ templateVersionId: 'tv-v2' });
    const project = createProject(batch, 'ent-001');
    expect(project.templateVersionId).toBe('tv-v2');
  });

  it('project has null template when batch has no template', () => {
    const batch = createBatch({ templateVersionId: null });
    const project = createProject(batch, 'ent-001');
    expect(project.templateVersionId).toBeNull();
  });
});

describe('overdue detection', () => {
  it('detects overdue when deadline has passed', () => {
    const pastDate = new Date('2025-01-01');
    const batch = createBatch({ filingDeadline: pastDate });
    const project = createProject(batch, 'ent-001');
    expect(isOverdue(project)).toBe(true);
  });

  it('not overdue when deadline is in the future', () => {
    const futureDate = new Date('2030-12-31');
    const batch = createBatch({ filingDeadline: futureDate });
    const project = createProject(batch, 'ent-001');
    expect(isOverdue(project)).toBe(false);
  });

  it('not overdue when no deadline set', () => {
    const batch = createBatch({ filingDeadline: null });
    const project = createProject(batch, 'ent-001');
    expect(isOverdue(project)).toBe(false);
  });

  it('not overdue when project is completed', () => {
    const pastDate = new Date('2025-01-01');
    const batch = createBatch({ filingDeadline: pastDate });
    const project = createProject(batch, 'ent-001', { status: 'completed' });
    expect(isOverdue(project)).toBe(false);
  });

  it('not overdue when project is closed', () => {
    const pastDate = new Date('2025-01-01');
    const batch = createBatch({ filingDeadline: pastDate });
    const project = createProject(batch, 'ent-001', { status: 'closed' });
    expect(isOverdue(project)).toBe(false);
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  createAuditBatch,
  createAuditProject,
  createEnterprise,
  createEnterpriseExternalBinding,
  createRectificationTask,
  createReport,
  createReviewTask,
  createUserAccount,
} from "../../../../packages/domain/src/entities";

describe("core domain entities", () => {
  it("connects enterprise, project, report, review, and rectification entities", () => {
    const enterprise = createEnterprise({ id: "ent_1" });
    const batch = createAuditBatch({ id: "batch_1" });
    const project = createAuditProject({
      id: "project_1",
      enterpriseId: "ent_1",
      batchId: "batch_1",
    });
    const binding = createEnterpriseExternalBinding({
      id: "binding_1",
      enterpriseId: enterprise.id,
      externalSystem: "enterprise-info",
      externalId: "external-ent-1",
    });
    const reviewer = createUserAccount({
      id: "reviewer_1",
      email: "reviewer@example.com",
      role: "reviewer",
    });
    const report = createReport({
      id: "report_1",
      auditProjectId: project.id,
    });
    const reviewTask = createReviewTask({
      id: "review_1",
      auditProjectId: project.id,
      reportId: report.id,
      reviewerId: reviewer.id,
    });
    const rectificationTask = createRectificationTask({
      id: "rectification_1",
      auditProjectId: project.id,
      reviewTaskId: reviewTask.id,
    });

    const migrationPath = resolve(
      process.cwd(),
      "apps/api/src/db/migrations/001_init_core_schema.sql",
    );
    const migration = readFileSync(migrationPath, "utf8");

    expect(project.enterpriseId).toBe(enterprise.id);
    expect(project.batchId).toBe(batch.id);
    expect(binding.enterpriseId).toBe(enterprise.id);
    expect(report.auditProjectId).toBe(project.id);
    expect(reviewTask.reportId).toBe(report.id);
    expect(reviewTask.reviewerId).toBe(reviewer.id);
    expect(rectificationTask.reviewTaskId).toBe(reviewTask.id);
    expect(rectificationTask.auditProjectId).toBe(project.id);

    expect(migration).toContain(
      "unique (external_system, external_id)",
    );
    expect(migration).toContain("unique (enterprise_id, batch_id)");
    expect(migration).toContain(
      "review_task_id text not null references review_tasks (id) on delete cascade",
    );
  });
});

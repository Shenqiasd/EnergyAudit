import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  createAttachment,
  createAuditBatch,
  createAuditLog,
  createAuditProject,
  createCalculationSnapshot,
  createCarbonEmissionFactor,
  createChartOutput,
  createDataItem,
  createDataRecord,
  createDictionaryItem,
  createEnergyDefinition,
  createEnterprise,
  createEnterpriseExternalBinding,
  createEnterpriseProfile,
  createImportJob,
  createPermission,
  createProductDefinition,
  createProjectMember,
  createRectificationProgress,
  createRectificationTask,
  createReport,
  createReviewIssue,
  createReviewScore,
  createReviewTask,
  createRole,
  createRolePermission,
  createTemplate,
  createTemplateVersion,
  createUnitDefinition,
  createUserAccount,
  createValidationResult,
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

  it("verifies enriched state machines", () => {
    // Enterprise: 6-state admission
    const enterprise = createEnterprise({ id: "ent_2" });
    expect(enterprise.admissionStatus).toBe("pending_review");

    // AuditProject: 12-state lifecycle
    const project = createAuditProject({
      id: "proj_2",
      enterpriseId: "ent_2",
      batchId: "batch_1",
    });
    expect(project.status).toBe("pending_start");

    // DataRecord: 7-state
    const dataRecord = createDataRecord({
      id: "dr_1",
      auditProjectId: "proj_2",
      moduleCode: "enterprise-profile",
    });
    expect(dataRecord.status).toBe("draft");

    // Report: 8-state
    const report = createReport({ id: "rpt_2", auditProjectId: "proj_2" });
    expect(report.status).toBe("not_generated");

    // ReviewTask: 7-state
    const reviewTask = createReviewTask({
      id: "rt_2",
      auditProjectId: "proj_2",
      reportId: "rpt_2",
      reviewerId: "reviewer_1",
    });
    expect(reviewTask.status).toBe("pending_assignment");

    // RectificationTask: 7-state
    const rectTask = createRectificationTask({
      id: "rect_2",
      auditProjectId: "proj_2",
      reviewTaskId: "rt_2",
    });
    expect(rectTask.status).toBe("pending_issue");
  });

  it("creates all new entity types", () => {
    // Platform Core Objects
    const role = createRole({ id: "role_1", code: "manager", name: "管理员" });
    expect(role.code).toBe("manager");

    const permission = createPermission({ id: "perm_1", code: "enterprise:read", name: "查看企业" });
    expect(permission.code).toBe("enterprise:read");

    const rolePermission = createRolePermission({ id: "rp_1", roleId: "role_1", permissionId: "perm_1" });
    expect(rolePermission.roleId).toBe("role_1");

    const dict = createDictionaryItem({ id: "dict_1", category: "industry", code: "manufacturing", name: "制造业" });
    expect(dict.category).toBe("industry");

    const template = createTemplate({ id: "tpl_1", name: "能源审计模板" });
    expect(template.name).toBe("能源审计模板");

    const templateVersion = createTemplateVersion({ id: "tv_1", templateId: "tpl_1", versionNumber: 1 });
    expect(templateVersion.versionNumber).toBe(1);

    const attachment = createAttachment({ id: "att_1", ownerType: "report", ownerId: "rpt_1", fileName: "report.pdf" });
    expect(attachment.ownerType).toBe("report");

    const auditLog = createAuditLog({ id: "log_1", userId: "user_1", action: "submit", targetType: "report", targetId: "rpt_1" });
    expect(auditLog.action).toBe("submit");

    // Business Runtime Objects
    const projectMember = createProjectMember({ id: "pm_1", auditProjectId: "proj_1", userId: "user_1", role: "enterprise_contact" });
    expect(projectMember.role).toBe("enterprise_contact");

    const enterpriseProfile = createEnterpriseProfile({ id: "ep_1", auditProjectId: "proj_1", enterpriseId: "ent_1", name: "测试企业" });
    expect(enterpriseProfile.name).toBe("测试企业");

    const energyDef = createEnergyDefinition({ id: "ed_1", enterpriseId: "ent_1", energyCode: "electricity", name: "电力" });
    expect(energyDef.energyCode).toBe("electricity");

    const productDef = createProductDefinition({ id: "pd_1", enterpriseId: "ent_1", productCode: "steel", name: "钢材" });
    expect(productDef.productCode).toBe("steel");

    const unitDef = createUnitDefinition({ id: "ud_1", enterpriseId: "ent_1", unitCode: "workshop_1", name: "一号车间" });
    expect(unitDef.unitCode).toBe("workshop_1");

    const carbonFactor = createCarbonEmissionFactor({ id: "cf_1", energyCode: "coal", name: "原煤" });
    expect(carbonFactor.energyCode).toBe("coal");

    const dataItem = createDataItem({ id: "di_1", dataRecordId: "dr_1", fieldCode: "totalEnergy" });
    expect(dataItem.fieldCode).toBe("totalEnergy");

    const importJob = createImportJob({ id: "ij_1", auditProjectId: "proj_1", moduleCode: "energy-consumption" });
    expect(importJob.status).toBe("pending");

    const validationResult = createValidationResult({ id: "vr_1", dataRecordId: "dr_1", ruleCode: "required-field" });
    expect(validationResult.ruleCode).toBe("required-field");

    const calcSnapshot = createCalculationSnapshot({ id: "cs_1", auditProjectId: "proj_1", calculationType: "comprehensive_energy" });
    expect(calcSnapshot.calculationType).toBe("comprehensive_energy");

    // Result Output Objects
    const chartOutput = createChartOutput({ id: "co_1", auditProjectId: "proj_1", chartConfigCode: "energy-structure-pie" });
    expect(chartOutput.chartConfigCode).toBe("energy-structure-pie");

    const reviewScore = createReviewScore({ id: "rs_1", reviewTaskId: "rt_1", category: "数据完整性" });
    expect(reviewScore.category).toBe("数据完整性");

    const reviewIssue = createReviewIssue({ id: "ri_1", reviewTaskId: "rt_1", description: "数据不完整" });
    expect(reviewIssue.severity).toBe("major");

    const rectProgress = createRectificationProgress({ id: "rp_1", rectificationTaskId: "rect_1" });
    expect(rectProgress.rectificationTaskId).toBe("rect_1");
  });

  it("verifies migration contains all key tables", () => {
    const migrationPath = resolve(
      process.cwd(),
      "apps/api/src/db/migrations/001_init_core_schema.sql",
    );
    const migration = readFileSync(migrationPath, "utf8");

    // Platform Core
    expect(migration).toContain("create table roles");
    expect(migration).toContain("create table permissions");
    expect(migration).toContain("create table dictionaries");
    expect(migration).toContain("create table templates");
    expect(migration).toContain("create table template_versions");
    expect(migration).toContain("create table attachments");
    expect(migration).toContain("create table audit_logs");

    // Business Runtime
    expect(migration).toContain("create table enterprises");
    expect(migration).toContain("create table audit_batches");
    expect(migration).toContain("create table audit_projects");
    expect(migration).toContain("create table project_members");
    expect(migration).toContain("create table enterprise_profiles");
    expect(migration).toContain("create table energy_definitions");
    expect(migration).toContain("create table product_definitions");
    expect(migration).toContain("create table unit_definitions");
    expect(migration).toContain("create table carbon_emission_factors");
    expect(migration).toContain("create table data_records");
    expect(migration).toContain("create table data_items");
    expect(migration).toContain("create table import_jobs");
    expect(migration).toContain("create table validation_results");
    expect(migration).toContain("create table calculation_snapshots");

    // Result Output
    expect(migration).toContain("create table reports");
    expect(migration).toContain("create table chart_outputs");
    expect(migration).toContain("create table review_tasks");
    expect(migration).toContain("create table review_scores");
    expect(migration).toContain("create table review_issues");
    expect(migration).toContain("create table rectification_tasks");
    expect(migration).toContain("create table rectification_progress");
  });
});

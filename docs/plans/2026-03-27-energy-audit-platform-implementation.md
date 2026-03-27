# Energy Audit Platform Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the full city energy audit platform from the approved business design, starting with a stable platform core and then delivering enterprise submission, report generation, review workflow, rectification tracking, configuration, and integrations.

**Architecture:** Use a layered architecture with a platform core, business modules, and output/governance services. Keep primary process control in code, keep field/module/rule/report structures configurable by version, and isolate external integrations behind adapters so business services remain stable while the enterprise info interface is still pending.

**Tech Stack:** To be locked in Task 1 through ADR; implementation assumes a web admin stack, API service, relational database, object storage, async job runner, and a pluggable online table component.

---

### Task 1: Lock Technical Architecture And Repository Layout

**Files:**
- Create: `docs/adr/2026-03-27-platform-stack.md`
- Create: `docs/architecture/repository-layout.md`
- Modify: `docs/plans/2026-03-27-energy-audit-platform-design.md`

**Step 1: Write the decision record**

Document the final choices for:

- Frontend framework
- Backend framework
- Database
- Async job system
- Auth strategy
- File storage
- Online spreadsheet integration strategy

Example decision skeleton:

```md
# Platform Stack ADR

## Decision

- Frontend: ...
- Backend: ...
- Database: ...
- Jobs: ...
- Storage: ...

## Why

- ...
```

**Step 2: Review the design constraints**

Confirm the ADR honors:

- external enterprise info integration is deferred but reserved
- history must remain version-safe
- review and rectification workflows stay code-controlled

**Step 3: Define repository layout**

Document the initial repository structure, for example:

```text
apps/web
apps/api
packages/domain
packages/config-engine
packages/reporting
packages/shared
infra/
docs/
```

**Step 4: Commit**

```bash
git add docs/adr/2026-03-27-platform-stack.md docs/architecture/repository-layout.md docs/plans/2026-03-27-energy-audit-platform-design.md
git commit -m "docs: lock platform stack and repo layout"
```

### Task 2: Initialize Platform Core Skeleton

**Files:**
- Create: `apps/api/src/modules/platform/README.md`
- Create: `apps/web/src/modules/platform/README.md`
- Create: `packages/domain/src/platform/README.md`
- Create: `packages/shared/src/constants/roles.ts`
- Test: `apps/api/tests/platform/platform-smoke.test.ts`

**Step 1: Write the failing smoke test**

```ts
describe("platform core skeleton", () => {
  it("exposes role constants for three-end model", () => {
    expect(PLATFORM_ROLES).toContain("enterprise_user");
    expect(PLATFORM_ROLES).toContain("manager");
    expect(PLATFORM_ROLES).toContain("reviewer");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/api/tests/platform/platform-smoke.test.ts`
Expected: FAIL because role constants and module skeleton do not exist

**Step 3: Write minimal implementation**

```ts
export const PLATFORM_ROLES = [
  "enterprise_user",
  "enterprise_admin",
  "manager",
  "reviewer",
] as const;
```

**Step 4: Add skeleton docs for module ownership**

Each README should state responsibility boundaries for:

- platform core
- business modules
- output and reporting

**Step 5: Run test to verify it passes**

Run: `pnpm test apps/api/tests/platform/platform-smoke.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add apps/api/src/modules/platform/README.md apps/web/src/modules/platform/README.md packages/domain/src/platform/README.md packages/shared/src/constants/roles.ts apps/api/tests/platform/platform-smoke.test.ts
git commit -m "feat: bootstrap platform core skeleton"
```

### Task 3: Implement Core Domain Model And Database Schema

**Scope:** Complete domain model covering all platform core objects, business runtime objects, and result output objects, with enriched state machines and field definitions aligned to the business design document.

**Files:**

平台核心对象：
- Create: `packages/domain/src/entities/role-permission.ts` — 角色、权限、角色权限关联
- Create: `packages/domain/src/entities/dictionary.ts` — 字典项
- Create: `packages/domain/src/entities/template.ts` — 模板与模板版本
- Create: `packages/domain/src/entities/attachment.ts` — 统一附件
- Create: `packages/domain/src/entities/audit-log.ts` — 审计日志

业务运行对象：
- Create: `packages/domain/src/entities/enterprise.ts` — 企业（6 状态准入）
- Create: `packages/domain/src/entities/audit-batch.ts` — 审计批次
- Create: `packages/domain/src/entities/audit-project.ts` — 审计项目（12 状态）
- Create: `packages/domain/src/entities/project-member.ts` — 项目成员
- Create: `packages/domain/src/entities/enterprise-profile.ts` — 企业信息快照
- Create: `packages/domain/src/entities/energy-definition.ts` — 能源品种定义
- Create: `packages/domain/src/entities/product-definition.ts` — 产品定义
- Create: `packages/domain/src/entities/unit-definition.ts` — 单元定义
- Create: `packages/domain/src/entities/carbon-emission-factor.ts` — 碳排放因子
- Create: `packages/domain/src/entities/data-record.ts` — 填报记录（7 状态）与数据项
- Create: `packages/domain/src/entities/import-job.ts` — 导入任务
- Create: `packages/domain/src/entities/validation-result.ts` — 校验结果
- Create: `packages/domain/src/entities/calculation-snapshot.ts` — 计算快照

结果输出对象：
- Create: `packages/domain/src/entities/report.ts` — 报告（8 状态）
- Create: `packages/domain/src/entities/chart-output.ts` — 图表输出
- Create: `packages/domain/src/entities/review-task.ts` — 审核任务（7 状态）
- Create: `packages/domain/src/entities/review-score.ts` — 审核评分
- Create: `packages/domain/src/entities/review-issue.ts` — 审核问题
- Create: `packages/domain/src/entities/rectification-task.ts` — 整改任务（7 状态）
- Create: `packages/domain/src/entities/rectification-progress.ts` — 整改进度

Schema:
- Create: `apps/api/src/db/migrations/001_init_core_schema.sql` — 全量初始 DDL（含 30+ 表）
- Test: `apps/api/tests/domain/core-entities.test.ts`

**Step 1: Write the failing entity test**

```ts
it("connects enterprise, project, report, review, and rectification entities", () => {
  const project = createAuditProject({ enterpriseId: "ent_1", batchId: "batch_1" });
  expect(project.enterpriseId).toBe("ent_1");
  expect(project.batchId).toBe("batch_1");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/api/tests/domain/core-entities.test.ts`
Expected: FAIL because entity factories and schema do not exist

**Step 3: Write implementation**

Create typed entities with factory functions organized into three categories:

**平台核心对象（Platform Core）：**
- Role / Permission / RolePermission — RBAC 权限模型
- DictionaryItem — 主数据字典（行业分类、能源品种等）
- Template / TemplateVersion — 模板版本化管理
- Attachment — 统一附件存储
- AuditLog — 审计日志

**业务运行对象（Business Runtime）：**
- Enterprise — 6 状态准入：pending_review → approved / rejected / suspended / locked / expired
- EnterpriseExternalBinding — 外部系统绑定（含 degraded 状态）
- UserAccount — 含 name、phone、externalIdentityId
- AuditBatch — 含 description、filingDeadline、reviewDeadline、createdBy
- AuditProject — 12 状态：pending_start → configuring → filing → pending_submit → pending_report → report_processing → pending_review → in_review → pending_rectification → in_rectification → completed → closed
- ProjectMember — 角色：enterprise_contact / enterprise_filler / assigned_reviewer / project_manager
- EnterpriseProfile — 项目创建时企业信息快照
- EnergyDefinition / ProductDefinition / UnitDefinition — 企业级基础配置
- CarbonEmissionFactor — 碳排放因子（含氧化率、来源标准、适用年份）
- DataRecord — 7 状态：draft → saved → validation_failed → pending_submit → submitted → returned → archived
- DataItem — 字段级数据（raw/calculated/manual_override/final value）
- ImportJob — 导入任务（5 状态）
- ValidationResult — 校验结果（error/warning/info 三级）
- CalculationSnapshot — 计算快照（含规则版本和参数快照）

**结果输出对象（Result Output）：**
- Report — 8 状态：not_generated → draft_generated → enterprise_revising → pending_final_upload → final_uploaded → in_review → archived → voided
- ChartOutput — 图表输出（含嵌入报告标记）
- ReviewTask — 7 状态：pending_assignment → assigned → in_review → pending_confirmation → returned → completed → closed
- ReviewScore — 分类评分
- ReviewIssue — 问题登记（4 级严重程度：critical/major/minor/suggestion）
- RectificationTask — 7 状态：pending_issue → pending_claim → in_progress → pending_acceptance → completed → delayed → closed
- RectificationProgress — 进度时间线

**Step 4: Add database migration**

Create `001_init_core_schema.sql` with全量初始 DDL，包含：
- 角色与权限表（roles, permissions, role_permissions）
- 字典表（dictionaries）
- 模板与版本表（templates, template_versions）
- 附件表（attachments）
- 审计日志表（audit_logs）
- 企业与用户表（enterprises, enterprise_external_bindings, user_accounts）
- 审计批次与项目表（audit_batches, audit_projects, project_members, enterprise_profiles）
- 基础配置表（energy_definitions, product_definitions, unit_definitions）
- 碳排放因子表（carbon_emission_factors）
- 填报与校验表（data_records, data_items, import_jobs, validation_results）
- 计算快照表（calculation_snapshots）
- 报告与图表表（reports, chart_outputs）
- 审核表（review_tasks, review_scores, review_issues）
- 整改表（rectification_tasks, rectification_progress）
- 必要索引和外键约束

**Step 5: Run test to verify it passes**

Run: `pnpm test apps/api/tests/domain/core-entities.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/domain/src/entities apps/api/src/db/migrations/001_init_core_schema.sql apps/api/tests/domain/core-entities.test.ts
git commit -m "feat: add complete domain schema with enriched state machines"
```

### Task 4: Build Enterprise Management And External Binding

**Scope:** Enterprise admission, archive management, external system binding, and user account provisioning for the three-end model.

**Files:**
- Create: `apps/api/src/modules/enterprise/enterprise.service.ts`
- Create: `apps/api/src/modules/enterprise/external-binding.service.ts`
- Create: `apps/api/src/modules/enterprise/enterprise.controller.ts`
- Create: `apps/api/src/modules/enterprise/admission.service.ts`
- Create: `apps/api/src/modules/user/user-account.service.ts`
- Create: `apps/api/src/modules/user/user-account.controller.ts`
- Create: `apps/web/src/modules/enterprise/pages/enterprise-list.tsx`
- Create: `apps/web/src/modules/enterprise/pages/enterprise-detail.tsx`
- Create: `apps/web/src/modules/enterprise/pages/admission-review.tsx`
- Create: `apps/web/src/modules/user/pages/user-management.tsx`
- Create: `apps/api/src/db/migrations/002_enterprise_admission.sql`
- Test: `apps/api/tests/enterprise/external-binding.test.ts`
- Test: `apps/api/tests/enterprise/admission-workflow.test.ts`

**Requirements Coverage:**
- 企业准入流程：申请 → 审核 → 建档 → 开通账号
- 企业档案维护（业务侧）
- 外部企业基本信息接口预留与绑定
- 统一社会信用代码自动匹配
- 同步状态与降级展示
- 企业状态管理（待审核/已通过/已驳回/已停用/已锁定/已过期）
- 用户账号与角色关联（企业用户/企业管理员/管理端/审核端）

**Step 1: Write the failing tests**

```ts
// apps/api/tests/enterprise/external-binding.test.ts
it("stores enterprise external binding without overwriting project snapshots", async () => {
  const binding = await bindEnterpriseToExternal({
    enterpriseId: "ent_1",
    externalSystem: "enterprise-info",
    externalId: "ext_1",
  });
  expect(binding.externalId).toBe("ext_1");
  expect(binding.syncStatus).toBe("synced");
});

// apps/api/tests/enterprise/admission-workflow.test.ts
it("transitions enterprise through admission states correctly", async () => {
  const enterprise = await createEnterpriseApplication({
    name: "测试企业",
    creditCode: "91110000000000000X",
  });
  expect(enterprise.admissionStatus).toBe("待审核");

  await approveAdmission(enterprise.id);
  const approved = await getEnterprise(enterprise.id);
  expect(approved.admissionStatus).toBe("已通过");
});

it("auto-matches enterprise by credit code when external binding exists", async () => {
  const result = await matchEnterpriseByCode("91110000000000000X");
  expect(result.matched).toBe(true);
  expect(result.externalId).toBeDefined();
});
```

**Step 2: Add database migration**

Create `002_enterprise_admission.sql` with:
- `enterprise_applications` table for admission workflow
- `admission_status` enum
- `sync_log` table for external sync history
- indexes on `credit_code` and `external_id`

**Step 3: Implement core services**

Implement:
- Enterprise CRUD with admission state machine
- External binding with auto-match by credit code
- Sync status tracking (synced/pending/failed/degraded)
- Manual resync trigger
- User account provisioning linked to enterprise
- Role assignment (enterprise_user, enterprise_admin, manager, reviewer)

**Step 4: Implement API controllers**

Expose endpoints:
- `POST /enterprises/applications` - submit admission
- `PUT /enterprises/:id/admission/approve` - approve
- `PUT /enterprises/:id/admission/reject` - reject
- `GET /enterprises` - list with filters
- `GET /enterprises/:id` - detail with binding status
- `POST /enterprises/:id/sync` - manual sync trigger
- `POST /users` - create user account
- `PUT /users/:id/roles` - assign roles

**Step 5: Build UI pages**

Create:
- Enterprise list with admission status filters
- Enterprise detail with external binding indicator
- Admission review page for managers
- User management page with role assignment

**Step 6: Run tests**

Run: `pnpm test apps/api/tests/enterprise/`
Expected: PASS

**Step 7: Commit**

```bash
git add apps/api/src/modules/enterprise apps/api/src/modules/user apps/web/src/modules/enterprise apps/web/src/modules/user apps/api/src/db/migrations/002_enterprise_admission.sql apps/api/tests/enterprise/
git commit -m "feat: enterprise admission, external binding, and user provisioning"
```

### Task 5: Build Audit Batch And Project Lifecycle Management

**Scope:** Audit batch creation, enterprise project assignment, status machine, and project lifecycle tracking from setup to completion.

**Files:**
- Create: `apps/api/src/modules/audit-batch/audit-batch.service.ts`
- Create: `apps/api/src/modules/audit-batch/audit-batch.controller.ts`
- Create: `apps/api/src/modules/audit-project/audit-project.service.ts`
- Create: `apps/api/src/modules/audit-project/audit-project.controller.ts`
- Create: `apps/api/src/modules/audit-project/project-status-machine.ts`
- Create: `apps/api/src/modules/audit-project/project-member.service.ts`
- Create: `apps/web/src/modules/audit-batch/pages/batch-list.tsx`
- Create: `apps/web/src/modules/audit-batch/pages/batch-detail.tsx`
- Create: `apps/web/src/modules/audit-project/pages/project-board.tsx`
- Create: `apps/web/src/modules/audit-project/pages/project-detail.tsx`
- Create: `apps/api/src/db/migrations/003_project_lifecycle.sql`
- Test: `apps/api/tests/audit-project/project-status-machine.test.ts`
- Test: `apps/api/tests/audit-project/project-lifecycle.test.ts`

**Requirements Coverage:**
- 审计批次管理（如"2026年度审计"），含批次描述、填报截止日期、审核截止日期
- 企业范围选择与项目批量创建
- 项目状态机：待启动 → 配置中 → 填报中 → 待提交 → 待生成报告 → 报告处理中 → 待审核 → 审核中 → 待整改 → 整改中 → 已完成 → 已关闭
- 状态转换规则与阻断条件
- 项目成员关系（企业联系人、填报人、审核员、项目经理）
- 截止日期管理与超期预警（详见设计文档第17章）
- 超期定时扫描（BullMQ 调度，每日检查）
- 超期前 N 天提醒（7天/3天/1天可配置）
- 超期标记（isOverdue）与管理端延期操作
- 项目快照与模板版本绑定

**Step 1: Write the failing tests**

```ts
// project-status-machine.test.ts
it("enforces valid state transitions", () => {
  expect(canTransition("配置中", "填报中")).toBe(true);
  expect(canTransition("填报中", "已完成")).toBe(false);
  expect(canTransition("待审核", "审核中")).toBe(true);
});

it("blocks transitions when preconditions not met", () => {
  const project = { status: "配置中", configComplete: false };
  expect(canTransition(project, "填报中")).toBe(false);
});

// project-lifecycle.test.ts
it("creates projects for selected enterprises in batch", async () => {
  const batch = await createAuditBatch({ name: "2026年度审计", year: 2026 });
  const projects = await assignEnterprisesToBatch(batch.id, ["ent_1", "ent_2"]);
  expect(projects).toHaveLength(2);
  expect(projects[0].status).toBe("待启动");
});

it("binds project to template version at creation", async () => {
  const project = await createAuditProject({ batchId: "batch_1", enterpriseId: "ent_1" });
  expect(project.templateVersionId).toBeDefined();
});
```

**Step 2: Add database migration**

Create `003_project_lifecycle.sql` with:
- `project_status` enum with all 12 states
- `project_members` table
- `project_snapshots` table for config/data snapshots
- `template_version_id` foreign key on projects
- indexes on status and batch

**Step 3: Implement status machine**

Implement:
- State transition validation with precondition checks
- Transition guards (config complete, validation passed, report uploaded, etc.)
- Automatic state progression triggers
- Status history logging

**Step 4: Implement services**

Implement:
- Batch CRUD with year/name/description
- Batch-to-enterprise assignment (bulk project creation)
- Project lifecycle operations (start, submit, complete, close)
- Project member management
- Template version binding at project creation

**Step 5: Build UI**

Create:
- Batch list with year filter
- Batch detail with enterprise selection and project overview
- Project board (kanban by status)
- Project detail with status timeline and member list

**Step 6: Run tests**

Run: `pnpm test apps/api/tests/audit-project/`
Expected: PASS

**Step 7: Commit**

```bash
git add apps/api/src/modules/audit-batch apps/api/src/modules/audit-project apps/web/src/modules/audit-batch apps/web/src/modules/audit-project apps/api/src/db/migrations/003_project_lifecycle.sql apps/api/tests/audit-project/
git commit -m "feat: audit batch and project lifecycle with status machine"
```

### Task 6: Build Master Data And Configuration Center

**Scope:** Platform dictionaries, enterprise-level energy/product/unit definitions, carbon emission factor management, and configuration validation framework.

**Files:**
- Create: `apps/api/src/modules/master-data/dictionary.service.ts`
- Create: `apps/api/src/modules/master-data/energy-definition.service.ts`
- Create: `apps/api/src/modules/master-data/product-definition.service.ts`
- Create: `apps/api/src/modules/master-data/unit-definition.service.ts`
- Create: `apps/api/src/modules/master-data/carbon-emission-factor.service.ts`
- Create: `apps/api/src/modules/master-data/master-data.controller.ts`
- Create: `apps/web/src/modules/master-data/pages/config-center.tsx`
- Create: `apps/web/src/modules/master-data/pages/energy-config.tsx`
- Create: `apps/web/src/modules/master-data/pages/product-config.tsx`
- Create: `apps/web/src/modules/master-data/pages/unit-config.tsx`
- Create: `apps/web/src/modules/master-data/pages/carbon-factor-config.tsx`
- Create: `apps/api/src/db/migrations/004_master_data.sql`
- Test: `apps/api/tests/master-data/master-data-validation.test.ts`
- Test: `apps/api/tests/master-data/config-completeness.test.ts`
- Test: `apps/api/tests/master-data/carbon-emission-factor.test.ts`

**Requirements Coverage:**
- 平台字典（行业分类、能源品种、计量单位、产品类型等）
- 企业级能源品种定义（名称、类型、折标系数、计量单位）
- 企业级产品定义（产品名称、单位、工序关联）
- 企业级单元定义（单元名称、类型、能源消耗边界）
- 碳排放因子管理（因子值、氧化率、来源标准、适用年份、默认值管理）
- 配置完整性校验（填报前置条件）
- 配置版本快照（项目绑定）

**Step 1: Write the failing tests**

```ts
// master-data-validation.test.ts
it("rejects data entry when energy reference is undefined", async () => {
  await expect(validateEnergyReference("proj_1", "unknown-energy"))
    .rejects.toThrow("能源品种未定义");
});

it("validates product-unit consistency", async () => {
  await expect(validateProductReference("proj_1", { productId: "prod_1", unitId: "unit_999" }))
    .rejects.toThrow("产品关联的单元不存在");
});

// config-completeness.test.ts
it("blocks project transition when config incomplete", async () => {
  const project = await getProject("proj_1");
  const canProceed = await checkConfigCompleteness(project.id);
  expect(canProceed.complete).toBe(false);
  expect(canProceed.missing).toContain("能源品种未配置");
});
```

**Step 2: Add database migration**

Create `004_master_data.sql` with:
- `dictionaries` table (category, code, name, parent)
- `enterprise_energy_definitions` table
- `enterprise_product_definitions` table
- `enterprise_unit_definitions` table
- `config_snapshots` table for project binding
- indexes on project_id and enterprise_id

**Step 3: Implement services**

Implement:
- Dictionary CRUD with hierarchical support
- Energy definition CRUD with conversion factors
- Product definition CRUD with unit linkage
- Unit definition CRUD with boundary description
- Config completeness checker
- Config snapshot creation on project start

**Step 4: Build UI**

Create:
- Config center dashboard showing completion status
- Energy config page with table editor
- Product config page with unit selector
- Unit config page with boundary diagram

**Step 5: Run tests**

Run: `pnpm test apps/api/tests/master-data/`
Expected: PASS

**Step 6: Commit**

```bash
git add apps/api/src/modules/master-data apps/web/src/modules/master-data apps/api/src/db/migrations/004_master_data.sql apps/api/tests/master-data/
git commit -m "feat: master data and enterprise config center"
```

### Task 7: Build Data Collection Framework (24 Modules)

**Scope:** Configurable data entry framework supporting 24 filing modules with validation, calculation, SpreadJS integration, collaborative locking, data rollback, and multi-format input (forms, tables, imports).

**Files:**
- Create: `packages/config-engine/src/module-config.ts`
- Create: `packages/config-engine/src/field-config.ts`
- Create: `packages/config-engine/src/validation-rule.ts`
- Create: `packages/config-engine/src/calculation-rule.ts`
- Create: `apps/api/src/modules/data-entry/data-record.service.ts`
- Create: `apps/api/src/modules/data-entry/data-validation.service.ts`
- Create: `apps/api/src/modules/data-entry/data-calculation.service.ts`
- Create: `apps/api/src/modules/data-entry/data-import.service.ts`
- Create: `apps/api/src/modules/data-entry/data-lock.service.ts`
- Create: `apps/api/src/modules/data-entry/data-entry.controller.ts`
- Create: `apps/web/src/modules/data-entry/pages/module-runner.tsx`
- Create: `apps/web/src/modules/data-entry/components/form-renderer.tsx`
- Create: `apps/web/src/modules/data-entry/components/table-renderer.tsx`
- Create: `apps/web/src/modules/data-entry/components/spreadsheet-adapter/spreadsheet-host.tsx`
- Create: `apps/web/src/modules/data-entry/components/spreadsheet-adapter/data-binder.ts`
- Create: `apps/web/src/modules/data-entry/components/spreadsheet-adapter/workbook-initializer.ts`
- Create: `apps/web/src/modules/data-entry/components/spreadsheet-adapter/formula-bridge.ts`
- Create: `apps/web/src/modules/data-entry/components/spreadsheet-adapter/event-handler.ts`
- Create: `apps/web/src/modules/data-entry/components/spreadsheet-adapter/export-handler.ts`
- Create: `apps/api/src/db/migrations/005_data_collection.sql`
- Create: `docs/modules/filing-modules-spec.md`
- Test: `apps/api/tests/data-entry/data-record-submit.test.ts`
- Test: `apps/api/tests/data-entry/validation-execution.test.ts`
- Test: `apps/api/tests/data-entry/data-lock.test.ts`

**Requirements Coverage:**
- 24个填报子模块框架（企业概况、经营指标、设备管理、能效分析、能源流、产品能耗、碳排放、节能措施等）
- SpreadJS 在线表格集成（适配器隔离架构，详见设计文档第14章）
- 模块启停配置
- 字段定义与分组
- 必填/显示/隐藏规则
- 字段联动
- 保存/提交动作
- 校验规则分层（基础/字段/跨字段/跨模块/完整性）
- 计算规则执行（字段级/模块级）
- 导入模板支持
- 数据记录状态（草稿/已保存/校验失败/待提交/已提交/已退回/已归档）
- 协同填报锁机制（乐观锁 + 30分钟超时自动释放）
- 数据退回与回滚（submitted → returned）

**Step 1: Write the failing tests**

```ts
// data-record-submit.test.ts
it("blocks submission when required field missing", async () => {
  const result = await submitRecord({
    projectId: "proj_1",
    moduleCode: "enterprise-profile",
    values: {},
  });
  expect(result.status).toBe("校验失败");
  expect(result.errors).toContainEqual(
    expect.objectContaining({ severity: "错误", field: "enterpriseName" })
  );
});

it("allows save with validation warnings", async () => {
  const result = await saveRecord({
    projectId: "proj_1",
    moduleCode: "energy-consumption",
    values: { totalEnergy: -100 },
  });
  expect(result.status).toBe("已保存");
  expect(result.warnings).toHaveLength(1);
});

// validation-execution.test.ts
it("executes cross-field validation rules", async () => {
  const errors = await validateRecord({
    moduleCode: "energy-balance",
    values: { input: 100, output: 120 },
  });
  expect(errors).toContainEqual(
    expect.objectContaining({ ruleCode: "energy-balance-check" })
  );
});
```

**Step 2: Add database migration**

Create `005_data_collection.sql` with:
- `data_modules` config table
- `data_fields` config table
- `validation_rules` table
- `calculation_rules` table
- `data_records` table
- `data_items` table (field values)
- `validation_results` table
- `import_jobs` table

**Step 3: Implement config engine**

Implement in `packages/config-engine`:
- Module config loader with enable/disable
- Field config with type, constraints, display rules
- Validation rule engine (5 layers)
- Calculation rule engine with dependency resolution
- Rule versioning tied to template version

**Step 4: Implement data services**

Implement:
- Data record CRUD with status transitions
- Save action (allows warnings)
- Submit action (blocks on errors)
- Validation execution with severity filtering
- Calculation execution with snapshot
- Import job processing

**Step 5: Document 24 modules**

Create `docs/modules/filing-modules-spec.md` listing:
1. 企业概况与目标
2. 经营与技术指标
3. 设备与计量管理
4. 能效与对标分析
5-24. (其他模块按设计文档)

**Step 6: Build UI**

Create:
- Module runner with dynamic form/table rendering
- Form renderer for simple fields
- Table renderer for tabular data
- Validation error display with severity colors
- Save/submit buttons with state management

**Step 7: Run tests**

Run: `pnpm test apps/api/tests/data-entry/`
Expected: PASS

**Step 8: Commit**

```bash
git add packages/config-engine apps/api/src/modules/data-entry apps/web/src/modules/data-entry apps/api/src/db/migrations/005_data_collection.sql docs/modules/ apps/api/tests/data-entry/
git commit -m "feat: configurable data collection framework with 24 modules"
```

### Task 8: Build Calculation, Chart, And Report Generation

**Scope:** Calculation engine, chart generation (including energy flow Sankey diagrams), report template system, draft report assembly with version management, and energy efficiency benchmarking.

**Files:**
- Create: `apps/api/src/modules/calculation/calculation.service.ts`
- Create: `apps/api/src/modules/calculation/calculation-engine.ts`
- Create: `apps/api/src/modules/calculation/carbon-calculation.service.ts`
- Create: `apps/api/src/modules/chart/chart.service.ts`
- Create: `apps/api/src/modules/chart/chart-config.ts`
- Create: `apps/api/src/modules/chart/energy-flow.service.ts`
- Create: `apps/api/src/modules/report/report.service.ts`
- Create: `apps/api/src/modules/report/report-assembly.service.ts`
- Create: `apps/api/src/modules/report/report.controller.ts`
- Create: `packages/reporting/src/report-template.ts`
- Create: `packages/reporting/src/chart-renderer.ts`
- Create: `packages/reporting/src/energy-flow-renderer.ts`
- Create: `apps/web/src/modules/report/pages/report-list.tsx`
- Create: `apps/web/src/modules/report/pages/report-viewer.tsx`
- Create: `apps/web/src/modules/report/components/energy-flow-diagram.tsx`
- Create: `apps/api/src/db/migrations/006_reporting.sql`
- Test: `apps/api/tests/report/report-draft-generation.test.ts`
- Test: `apps/api/tests/calculation/calculation-snapshot.test.ts`
- Test: `apps/api/tests/calculation/carbon-calculation.test.ts`

**Requirements Coverage:**
- 关键指标计算（综合能耗、当量值、等价值、单位产值能耗、产品单耗、碳排放、节能量等）
- 碳排放计算（活动数据 × 排放因子 × 氧化率，集成碳排放因子表）
- 计算结果快照保存
- 图表配置与生成（规定图表+辅助图表）
- 能源流程图 Sankey 图生成（详见设计文档第19章）
- 能效对标分析（与行业标杆值对比）
- 报告模板（章节结构、字段映射、图表嵌入）
- 报告版本管理（系统初稿/企业修订稿/归档终稿）
- 报告状态（未生成/已生成初稿/企业修订中/待提交终稿/终稿已上传/审核中/已归档/已作废）
- 异步报告生成任务

**Step 1: Write the failing tests**

```ts
// calculation-snapshot.test.ts
it("calculates comprehensive energy consumption with conversion factors", async () => {
  const result = await calculateComprehensiveEnergy({
    projectId: "proj_1",
    energyData: [
      { type: "electricity", value: 1000, unit: "kWh" },
      { type: "coal", value: 500, unit: "kg" },
    ],
  });
  expect(result.totalTce).toBeCloseTo(0.123 + 0.357, 2);
  expect(result.snapshotId).toBeDefined();
});

// report-draft-generation.test.ts
it("generates draft report from project data and calculations", async () => {
  const report = await generateDraftReport({ projectId: "proj_1" });
  expect(report.versionType).toBe("system_draft");
  expect(report.status).toBe("已生成初稿");
  expect(report.sections).toHaveLength(8);
});

it("embeds charts into report sections", async () => {
  const report = await generateDraftReport({ projectId: "proj_1" });
  const energySection = report.sections.find(s => s.code === "energy-consumption");
  expect(energySection.charts).toContainEqual(
    expect.objectContaining({ chartCode: "energy-structure-pie" })
  );
});
```

**Step 2: Add database migration**

Create `006_reporting.sql` with:
- `calculation_snapshots` table
- `chart_outputs` table
- `report_versions` table
- `report_sections` table
- `report_status` enum
- indexes on project_id and version_type

**Step 3: Implement calculation engine**

Implement:
- Calculation rule executor with formula parsing
- Conversion factor lookup
- Dependency resolution for chained calculations
- Snapshot creation with timestamp and rule version
- Key metrics: 综合能耗、单耗、碳排放、节能量

**Step 4: Implement chart service**

Implement:
- Chart config loader (type, dimensions, metrics)
- Data aggregation for charts
- Chart output generation (JSON format)
- Chart embedding in reports

**Step 5: Implement report service**

Implement in `packages/reporting`:
- Report template loader with sections
- Field mapping from data records to report
- Chart insertion rules
- Report assembly orchestrator

Implement in `apps/api`:
- Draft generation as async job
- Version management (create, upload, archive)
- Report download endpoint
- Report status transitions

**Step 6: Build UI**

Create:
- Report list with version filter
- Report viewer with section navigation
- Chart display components
- Download/upload buttons

**Step 7: Run tests**

Run: `pnpm test apps/api/tests/report/ apps/api/tests/calculation/`
Expected: PASS

**Step 8: Commit**

```bash
git add apps/api/src/modules/calculation apps/api/src/modules/chart apps/api/src/modules/report packages/reporting apps/web/src/modules/report apps/api/src/db/migrations/006_reporting.sql apps/api/tests/report/ apps/api/tests/calculation/
git commit -m "feat: calculation engine, chart generation, and report assembly"
```

### Task 9: Build Review And Rectification Workflows

**Scope:** Review task assignment, scoring system, issue registration, rectification task generation, and closure tracking.

**Files:**
- Create: `apps/api/src/modules/review/review-task.service.ts`
- Create: `apps/api/src/modules/review/review-score.service.ts`
- Create: `apps/api/src/modules/review/review-issue.service.ts`
- Create: `apps/api/src/modules/review/review.controller.ts`
- Create: `apps/api/src/modules/rectification/rectification.service.ts`
- Create: `apps/api/src/modules/rectification/rectification.controller.ts`
- Create: `apps/web/src/modules/review/pages/review-workbench.tsx`
- Create: `apps/web/src/modules/review/pages/review-scoring.tsx`
- Create: `apps/web/src/modules/rectification/pages/rectification-board.tsx`
- Create: `apps/web/src/modules/rectification/pages/rectification-detail.tsx`
- Create: `apps/api/src/db/migrations/007_review_rectification.sql`
- Test: `apps/api/tests/review/review-to-rectification.test.ts`
- Test: `apps/api/tests/review/review-workflow.test.ts`

**Requirements Coverage:**
- 审核任务分派（管理端 → 审核端）
- 审核任务状态（待分派/已分派/审核中/待确认/已退回/已完成/已关闭）
- 评分表结构化录入
- 问题登记（问题描述、严重程度、整改建议）
- 审核结论输出
- 整改任务生成（从审核问题/节能潜力）
- 整改任务状态（待下发/待认领/整改中/待验收/已完成/延期中/已关闭）
- 整改进度跟踪
- 整改闭环验证

**Step 1: Write the failing tests**

```ts
// review-workflow.test.ts
it("assigns review task to reviewer", async () => {
  const task = await assignReviewTask({
    projectId: "proj_1",
    reviewerId: "reviewer_1",
  });
  expect(task.status).toBe("已分派");
  expect(task.reviewerId).toBe("reviewer_1");
});

it("records structured review scores", async () => {
  const scores = await submitReviewScores({
    taskId: "task_1",
    scores: [
      { category: "数据完整性", score: 85, maxScore: 100 },
      { category: "数据准确性", score: 90, maxScore: 100 },
    ],
  });
  expect(scores).toHaveLength(2);
});

// review-to-rectification.test.ts
it("creates rectification tasks from confirmed review issues", async () => {
  const issue = await createReviewIssue({
    taskId: "task_1",
    description: "能源计量设备未校准",
    severity: "high",
  });

  const rectTasks = await generateRectificationTasks([issue.id]);
  expect(rectTasks).toHaveLength(1);
  expect(rectTasks[0].status).toBe("待下发");
  expect(rectTasks[0].sourceIssueId).toBe(issue.id);
});

it("tracks rectification progress to completion", async () => {
  const task = await createRectificationTask({
    projectId: "proj_1",
    title: "完成设备校准",
  });

  await updateRectificationProgress(task.id, {
    status: "整改中",
    progress: 50,
    note: "已联系校准单位",
  });

  await completeRectification(task.id, {
    completionNote: "校准完成，已上传证明",
    attachments: ["cert_1.pdf"],
  });

  const completed = await getRectificationTask(task.id);
  expect(completed.status).toBe("已完成");
});
```

**Step 2: Add database migration**

Create `007_review_rectification.sql` with:
- `review_tasks` table
- `review_scores` table
- `review_issues` table
- `rectification_tasks` table
- `rectification_progress` table
- `review_task_status` enum
- `rectification_task_status` enum
- `issue_severity` enum

**Step 3: Implement review services**

Implement:
- Task assignment with reviewer selection
- Score submission with category structure
- Issue registration with severity
- Review conclusion generation
- Task status transitions

**Step 4: Implement rectification services**

Implement:
- Task generation from issues
- Task assignment to enterprise
- Progress tracking with timeline
- Completion verification
- Closure workflow

**Step 5: Build UI**

Create:
- Review workbench (task list for reviewers)
- Review scoring page with structured form
- Issue registration form
- Rectification board (kanban by status)
- Rectification detail with progress timeline

**Step 6: Run tests**

Run: `pnpm test apps/api/tests/review/`
Expected: PASS

**Step 7: Commit**

```bash
git add apps/api/src/modules/review apps/api/src/modules/rectification apps/web/src/modules/review apps/web/src/modules/rectification apps/api/src/db/migrations/007_review_rectification.sql apps/api/tests/review/
git commit -m "feat: review and rectification workflow with issue tracking"
```

### Task 10: Build Integration, Async Jobs, And Operational Infrastructure

**Scope:** External system adapters, async job framework, audit logging, and operational resilience.

**Files:**
- Create: `packages/integrations/src/enterprise-info.adapter.ts`
- Create: `packages/integrations/src/auth-provider.adapter.ts`
- Create: `packages/integrations/src/storage.adapter.ts`
- Create: `apps/api/src/modules/integration/sync-job.service.ts`
- Create: `apps/api/src/modules/integration/integration.controller.ts`
- Create: `apps/api/src/modules/jobs/job-runner.ts`
- Create: `apps/api/src/modules/jobs/job-registry.ts`
- Create: `apps/api/src/modules/audit-log/audit-log.service.ts`
- Create: `apps/api/src/modules/audit-log/audit-log.controller.ts`
- Create: `apps/web/src/modules/integration/pages/sync-status.tsx`
- Create: `apps/api/src/db/migrations/008_integration_jobs.sql`
- Test: `apps/api/tests/integration/enterprise-sync-retry.test.ts`
- Test: `apps/api/tests/jobs/async-job-execution.test.ts`

**Requirements Coverage:**
- 企业基本信息接口适配器（拉取/事件/人工触发）
- 同步失败重试机制
- 降级模式（保留最近成功快照）
- 异步任务队列（报告生成、批量操作、导入导出）
- 审计日志（关键操作留痕）
- 附件与文件管理（S3兼容存储）

**Step 1: Write the failing tests**

```ts
// enterprise-sync-retry.test.ts
it("retries failed sync with exponential backoff", async () => {
  const job = await triggerEnterpriseSync("ent_1");

  // Simulate failure
  await markSyncFailed(job.id, "Connection timeout");

  const retried = await getSyncJob(job.id);
  expect(retried.retryCount).toBe(1);
  expect(retried.nextRetryAt).toBeDefined();
});

it("enters degraded mode after max retries", async () => {
  const result = await syncEnterpriseWithRetries("ent_1", { maxRetries: 3 });
  expect(result.mode).toBe("degraded");
  expect(result.lastSuccessfulSnapshot).toBeDefined();
});

// async-job-execution.test.ts
it("executes report generation as async job", async () => {
  const job = await enqueueJob({
    type: "report-generation",
    payload: { projectId: "proj_1" },
  });

  await processJob(job.id);

  const completed = await getJob(job.id);
  expect(completed.status).toBe("completed");
  expect(completed.result.reportId).toBeDefined();
});
```

**Step 2: Add database migration**

Create `008_integration_jobs.sql` with:
- `sync_jobs` table
- `async_jobs` table (type, status, payload, result)
- `audit_logs` table
- `file_attachments` table
- indexes on status and created_at

**Step 3: Implement integration adapters**

Implement in `packages/integrations`:
- Enterprise info adapter interface
- Mock adapter for development
- Auth provider adapter interface
- Storage adapter (S3-compatible)

**Step 4: Implement sync services**

Implement:
- Sync job orchestrator
- Retry logic with exponential backoff
- Degraded mode handler
- Sync log recording
- Manual sync trigger

**Step 5: Implement job framework**

Implement:
- Job registry with type handlers
- BullMQ integration
- Job enqueue/process/retry
- Job types: report-generation, batch-import, batch-assignment

**Step 6: Implement audit logging**

Implement:
- Audit log writer
- Key operation tracking (login, data submit, review, approval)
- Query interface for audit trail

**Step 7: Build UI**

Create:
- Sync status dashboard
- Manual sync trigger button
- Audit log viewer

**Step 8: Run tests**

Run: `pnpm test apps/api/tests/integration/ apps/api/tests/jobs/`
Expected: PASS

**Step 9: Commit**

```bash
git add packages/integrations apps/api/src/modules/integration apps/api/src/modules/jobs apps/api/src/modules/audit-log apps/web/src/modules/integration apps/api/src/db/migrations/008_integration_jobs.sql apps/api/tests/integration/ apps/api/tests/jobs/
git commit -m "feat: integration adapters, async jobs, and audit logging"
```

### Task 11: End-To-End Verification And Delivery

**Scope:** Complete system verification, sample data seeding, acceptance testing, and delivery documentation.

**Files:**
- Create: `docs/testing/end-to-end-checklist.md`
- Create: `docs/testing/sample-data-seed.md`
- Create: `docs/testing/acceptance-criteria.md`
- Create: `scripts/seed-sample-data.ts`
- Create: `docs/deployment/deployment-guide.md`
- Modify: `docs/plans/2026-03-27-energy-audit-platform-design.md`
- Modify: `docs/plans/2026-03-27-energy-audit-platform-implementation.md`

**Requirements Coverage:**
- 完整业务流程验证
- 三端功能验证
- 配置化能力验证
- 外部接口降级验证
- 性能基准测试
- 交付验收清单

**Step 1: Write end-to-end checklist**

Create `docs/testing/end-to-end-checklist.md` covering:

**企业端流程：**
- [ ] 企业注册申请
- [ ] 企业基础配置（能源/产品/单元）
- [ ] 24个模块数据填报
- [ ] 保存/提交/退回流程
- [ ] 校验规则执行
- [ ] 报告初稿生成
- [ ] 报告下载/上传
- [ ] 整改任务接收与处理

**管理端流程：**
- [ ] 企业准入审核
- [ ] 审计批次创建
- [ ] 企业分配到批次
- [ ] 审核任务分派
- [ ] 整改督办
- [ ] 统计分析查看

**审核端流程：**
- [ ] 审核任务查看
- [ ] 评分表填写
- [ ] 问题登记
- [ ] 审核结论提交

**系统能力：**
- [ ] 外部同步降级模式
- [ ] 异步任务执行
- [ ] 审计日志记录
- [ ] 权限隔离验证

**Step 2: Create sample data seed**

Create `docs/testing/sample-data-seed.md` defining:
- 1 个审计批次（2026年度审计）
- 3 个企业（制造业/能源/化工）
- 5 个用户账号（企业用户×2、管理员×2、审核员×1）
- 完整配置数据（能源/产品/单元）
- 部分填报数据
- 1 个报告
- 1 个审核任务
- 2 个整改任务

**Step 3: Implement seed script**

Create `scripts/seed-sample-data.ts` that:
- Clears existing data (dev only)
- Seeds enterprises with external bindings
- Seeds users with roles
- Seeds batch and projects
- Seeds master data
- Seeds partial filing data
- Triggers report generation
- Creates review and rectification tasks

**Step 4: Write acceptance criteria**

Create `docs/testing/acceptance-criteria.md` with:
- 功能完整性标准
- 性能基准（报告生成<30s、页面响应<2s）
- 数据一致性要求
- 安全性要求
- 可用性要求

**Step 5: Run full test suite**

```bash
# Unit and integration tests
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint

# Build verification
pnpm build
```

Expected: All PASS

**Step 6: Run seed and manual verification**

```bash
# Seed sample data
pnpm seed:sample

# Start dev environment
pnpm dev

# Manual verification against checklist
```

**Step 7: Write deployment guide**

Create `docs/deployment/deployment-guide.md` with:
- Environment requirements
- Database setup
- Redis setup
- S3 storage setup
- Environment variables
- Migration execution
- Initial admin account creation

**Step 8: Update design and implementation docs**

Mark implementation status in both documents:
- Task 1-11: ✅ Completed
- Add "Implementation Complete" section
- Document known limitations
- List future enhancements

**Step 9: Final commit**

```bash
git add docs/testing/ scripts/seed-sample-data.ts docs/deployment/ docs/plans/
git commit -m "docs: add end-to-end verification and delivery documentation"
```

**Step 10: Create delivery summary**

Generate summary report:
- ✅ 平台核心底座
- ✅ 企业管理与外部绑定
- ✅ 审计批次与项目生命周期
- ✅ 主数据与配置中心
- ✅ 24模块数据采集框架
- ✅ 计算、图表与报告生成
- ✅ 审核与整改闭环
- ✅ 集成、异步任务与审计日志
- ✅ 端到端验证与交付文档

**Delivery Artifacts:**
- Source code (all tasks)
- Database migrations (8 files)
- Test suite (100+ tests)
- Documentation (design, implementation, testing, deployment)
- Sample data seed
- Deployment guide

### Task 12: Build Platform Statistics And Decision Support Dashboard

**Scope:** Management-side statistics, dashboards, ledgers (台账), and data export capabilities for decision support.

**Files:**
- Create: `apps/api/src/modules/statistics/statistics.service.ts`
- Create: `apps/api/src/modules/statistics/batch-statistics.service.ts`
- Create: `apps/api/src/modules/statistics/industry-statistics.service.ts`
- Create: `apps/api/src/modules/statistics/carbon-statistics.service.ts`
- Create: `apps/api/src/modules/statistics/statistics.controller.ts`
- Create: `apps/api/src/modules/ledger/enterprise-ledger.service.ts`
- Create: `apps/api/src/modules/ledger/review-ledger.service.ts`
- Create: `apps/api/src/modules/ledger/rectification-ledger.service.ts`
- Create: `apps/api/src/modules/ledger/ledger.controller.ts`
- Create: `apps/api/src/modules/export/excel-export.service.ts`
- Create: `apps/web/src/modules/manager/pages/dashboard.tsx`
- Create: `apps/web/src/modules/manager/components/progress-board.tsx`
- Create: `apps/web/src/modules/manager/components/kpi-cards.tsx`
- Create: `apps/web/src/modules/manager/components/alert-list.tsx`
- Create: `apps/web/src/modules/manager/pages/enterprise-ledger.tsx`
- Create: `apps/web/src/modules/manager/pages/review-ledger.tsx`
- Create: `apps/web/src/modules/manager/pages/rectification-ledger.tsx`
- Test: `apps/api/tests/statistics/batch-statistics.test.ts`
- Test: `apps/api/tests/statistics/carbon-statistics.test.ts`
- Test: `apps/api/tests/ledger/enterprise-ledger.test.ts`

**Requirements Coverage (对齐设计文档第20章):**
- 按批次统计：完成率、超期率、平均得分
- 按行业统计：行业能耗分布、行业达标率
- 按区域统计：区域能耗热力图
- 按企业统计：企业能耗排名、历年趋势
- 碳排放统计：总量、结构、趋势
- 企业台账：全部企业的审计状态和关键指标汇总
- 审核台账：审核任务完成情况和评分汇总
- 整改台账：整改任务状态和完成情况汇总
- Excel 导出
- 管理端首页看板：进度看板、关键指标卡片、异常预警列表、最近操作时间线

**Step 1: Write the failing tests**

```ts
// batch-statistics.test.ts
it("calculates batch completion rate", async () => {
  const stats = await getBatchStatistics("batch_1");
  expect(stats.completionRate).toBeGreaterThanOrEqual(0);
  expect(stats.completionRate).toBeLessThanOrEqual(1);
  expect(stats.overdueRate).toBeDefined();
  expect(stats.averageScore).toBeDefined();
});

// carbon-statistics.test.ts
it("aggregates carbon emissions by energy type", async () => {
  const stats = await getCarbonStatistics({ batchId: "batch_1" });
  expect(stats.totalEmissions).toBeGreaterThan(0);
  expect(stats.byEnergyType).toBeInstanceOf(Array);
  expect(stats.trend).toBeDefined();
});

// enterprise-ledger.test.ts
it("generates enterprise ledger with audit status", async () => {
  const ledger = await getEnterpriseLedger({ batchId: "batch_1" });
  expect(ledger.rows).toBeInstanceOf(Array);
  expect(ledger.rows[0]).toHaveProperty("enterpriseName");
  expect(ledger.rows[0]).toHaveProperty("projectStatus");
  expect(ledger.rows[0]).toHaveProperty("totalEnergy");
});
```

**Step 2: Implement statistics services**

Implement:
- Batch statistics aggregation (completion rate, overdue rate, average score)
- Industry statistics with energy distribution
- Carbon emission statistics with trend analysis
- Enterprise ranking and historical comparison

**Step 3: Implement ledger services**

Implement:
- Enterprise ledger (all enterprises with audit status and key metrics)
- Review ledger (review task completion and scoring summary)
- Rectification ledger (task status and completion summary)
- Configurable column selection
- Filtering and sorting

**Step 4: Implement Excel export**

Implement:
- Generic Excel export service
- Ledger-to-Excel mapping
- Statistics report export

**Step 5: Build UI**

Create:
- Manager dashboard with progress board, KPI cards, alert list
- Enterprise ledger page with filters and export button
- Review ledger page
- Rectification ledger page
- Chart components for statistics visualization

**Step 6: Run tests**

Run: `pnpm test apps/api/tests/statistics/ apps/api/tests/ledger/`
Expected: PASS

**Step 7: Commit**

```bash
git add apps/api/src/modules/statistics apps/api/src/modules/ledger apps/api/src/modules/export apps/web/src/modules/manager apps/api/tests/statistics/ apps/api/tests/ledger/
git commit -m "feat: platform statistics, ledgers, and decision support dashboard"
```

### Task 13: Platform Merge Strategy (节能诊断 + 能源审计合并预留)

**Scope:** Prepare the platform for merging energy diagnosis (节能诊断) and energy audit (能源审计) into a unified system by adding business type differentiation, template branching, and module visibility controls.

**Files:**
- Modify: `packages/domain/src/entities/audit-batch.ts` — add businessType field
- Modify: `packages/domain/src/entities/audit-project.ts` — add businessType field
- Create: `apps/api/src/modules/business-type/business-type.service.ts`
- Create: `apps/api/src/modules/business-type/business-type.controller.ts`
- Create: `packages/config-engine/src/module-visibility.ts`
- Create: `apps/api/src/db/migrations/009_business_type.sql`
- Test: `apps/api/tests/business-type/business-type-routing.test.ts`

**Requirements Coverage (对齐设计文档第16章):**
- 业务类型标识（energy_audit / energy_diagnosis）
- 模板差异化（通过 TemplateVersion 区分不同业务类型的填报模板）
- 模块启停控制（不同业务类型的模块可见性配置）
- 流程差异支持（通过状态机配置支持不同的流程分支）
- 报告差异支持（通过 ReportTemplate 区分不同业务类型的报告格式）
- 数据隔离（同一企业可同时参与能源审计和节能诊断）
- 统计分析按业务类型筛选或汇总

**Step 1: Write the failing tests**

```ts
// business-type-routing.test.ts
it("creates audit batch with business type", async () => {
  const batch = await createAuditBatch({
    name: "2026年度能源审计",
    year: 2026,
    businessType: "energy_audit",
  });
  expect(batch.businessType).toBe("energy_audit");
});

it("creates diagnosis batch with different template", async () => {
  const batch = await createAuditBatch({
    name: "2026年度节能诊断",
    year: 2026,
    businessType: "energy_diagnosis",
  });
  expect(batch.businessType).toBe("energy_diagnosis");
  expect(batch.templateVersionId).not.toBe(auditBatch.templateVersionId);
});

it("controls module visibility by business type", async () => {
  const auditModules = await getVisibleModules("energy_audit");
  const diagModules = await getVisibleModules("energy_diagnosis");
  expect(auditModules.length).toBeGreaterThan(0);
  expect(diagModules.length).toBeGreaterThan(0);
  expect(auditModules).not.toEqual(diagModules);
});
```

**Step 2: Add database migration**

Create `009_business_type.sql` with:
- Add `business_type` column to `audit_batches` (default: 'energy_audit')
- Add `business_type` column to `audit_projects` (default: 'energy_audit')
- Add `module_visibility` table for business type module configuration
- Add index on business_type

**Step 3: Implement business type service**

Implement:
- Business type configuration
- Template routing by business type
- Module visibility rules by business type
- Report template routing by business type

**Step 4: Implement module visibility config**

Implement in `packages/config-engine`:
- Module visibility configuration per business type
- Module enable/disable by business type
- UI module filtering

**Step 5: Run tests**

Run: `pnpm test apps/api/tests/business-type/`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/domain/src/entities packages/config-engine/src/module-visibility.ts apps/api/src/modules/business-type apps/api/src/db/migrations/009_business_type.sql apps/api/tests/business-type/
git commit -m "feat: business type differentiation for platform merge readiness"
```

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

**Files:**
- Create: `packages/domain/src/entities/enterprise.ts`
- Create: `packages/domain/src/entities/audit-batch.ts`
- Create: `packages/domain/src/entities/audit-project.ts`
- Create: `packages/domain/src/entities/report.ts`
- Create: `packages/domain/src/entities/review-task.ts`
- Create: `packages/domain/src/entities/rectification-task.ts`
- Create: `apps/api/src/db/migrations/001_init_core_schema.sql`
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

**Step 3: Write minimal implementation**

Create typed entities for:

- Enterprise
- EnterpriseExternalBinding
- UserAccount
- AuditBatch
- AuditProject
- Report
- ReviewTask
- RectificationTask

**Step 4: Add database migration**

Create the initial schema for core tables and foreign keys.

**Step 5: Run test to verify it passes**

Run: `pnpm test apps/api/tests/domain/core-entities.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/domain/src/entities apps/api/src/db/migrations/001_init_core_schema.sql apps/api/tests/domain/core-entities.test.ts
git commit -m "feat: add core domain schema"
```

### Task 4: Build Enterprise And External Binding Services

**Files:**
- Create: `apps/api/src/modules/enterprise/enterprise.service.ts`
- Create: `apps/api/src/modules/enterprise/external-binding.service.ts`
- Create: `apps/api/src/modules/enterprise/enterprise.controller.ts`
- Create: `apps/web/src/modules/enterprise/pages/enterprise-list.tsx`
- Create: `apps/web/src/modules/enterprise/pages/enterprise-detail.tsx`
- Test: `apps/api/tests/enterprise/external-binding.test.ts`

**Step 1: Write the failing service test**

```ts
it("stores enterprise external binding metadata without overwriting project snapshots", async () => {
  const binding = await bindEnterpriseToExternal({
    enterpriseId: "ent_1",
    externalSystem: "enterprise-info",
    externalId: "ext_1",
  });
  expect(binding.externalId).toBe("ext_1");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/api/tests/enterprise/external-binding.test.ts`
Expected: FAIL because binding service does not exist

**Step 3: Write minimal implementation**

Implement:

- enterprise CRUD for business-side archive
- external binding records
- sync status fields
- manual resync endpoint placeholder

**Step 4: Add UI placeholders**

Create pages for:

- enterprise list
- enterprise detail
- external binding status

**Step 5: Run test to verify it passes**

Run: `pnpm test apps/api/tests/enterprise/external-binding.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add apps/api/src/modules/enterprise apps/web/src/modules/enterprise apps/api/tests/enterprise/external-binding.test.ts
git commit -m "feat: add enterprise archive and external binding flow"
```

### Task 5: Build Audit Batch And Project Management

**Files:**
- Create: `apps/api/src/modules/audit-batch/audit-batch.service.ts`
- Create: `apps/api/src/modules/audit-project/audit-project.service.ts`
- Create: `apps/api/src/modules/audit-project/project-status-machine.ts`
- Create: `apps/web/src/modules/audit-project/pages/project-board.tsx`
- Test: `apps/api/tests/audit-project/project-status-machine.test.ts`

**Step 1: Write the failing status test**

```ts
it("moves an audit project from setup to filing to review states in order", () => {
  expect(canTransition("配置中", "填报中")).toBe(true);
  expect(canTransition("填报中", "已完成")).toBe(false);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/api/tests/audit-project/project-status-machine.test.ts`
Expected: FAIL because status machine does not exist

**Step 3: Write minimal implementation**

Implement:

- audit batch entity service
- enterprise project creation
- status transition guards
- due dates and assignee fields

**Step 4: Run test to verify it passes**

Run: `pnpm test apps/api/tests/audit-project/project-status-machine.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/modules/audit-batch apps/api/src/modules/audit-project apps/web/src/modules/audit-project apps/api/tests/audit-project/project-status-machine.test.ts
git commit -m "feat: add audit batch and project workflow"
```

### Task 6: Build Configuration And Master Data Modules

**Files:**
- Create: `apps/api/src/modules/master-data/dictionary.service.ts`
- Create: `apps/api/src/modules/master-data/energy-definition.service.ts`
- Create: `apps/api/src/modules/master-data/product-definition.service.ts`
- Create: `apps/api/src/modules/master-data/unit-definition.service.ts`
- Create: `apps/web/src/modules/master-data/pages/config-center.tsx`
- Test: `apps/api/tests/master-data/master-data-validation.test.ts`

**Step 1: Write the failing validation test**

```ts
it("rejects project data rows that reference undefined energy items", async () => {
  await expect(validateEnergyReference("unknown-energy")).rejects.toThrow();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/api/tests/master-data/master-data-validation.test.ts`
Expected: FAIL because master data services do not exist

**Step 3: Write minimal implementation**

Implement:

- platform dictionaries
- enterprise energy definitions
- enterprise product definitions
- enterprise unit definitions

**Step 4: Run test to verify it passes**

Run: `pnpm test apps/api/tests/master-data/master-data-validation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/modules/master-data apps/web/src/modules/master-data apps/api/tests/master-data/master-data-validation.test.ts
git commit -m "feat: add master data and enterprise config center"
```

### Task 7: Build Data Collection Framework

**Files:**
- Create: `packages/config-engine/src/module-config.ts`
- Create: `packages/config-engine/src/field-config.ts`
- Create: `apps/api/src/modules/data-entry/data-record.service.ts`
- Create: `apps/api/src/modules/data-entry/data-validation.service.ts`
- Create: `apps/web/src/modules/data-entry/pages/module-runner.tsx`
- Test: `apps/api/tests/data-entry/data-record-submit.test.ts`

**Step 1: Write the failing submission test**

```ts
it("blocks submission when a required field is missing", async () => {
  const result = await submitRecord({
    moduleCode: "enterprise-profile",
    values: {},
  });
  expect(result.status).toBe("校验失败");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/api/tests/data-entry/data-record-submit.test.ts`
Expected: FAIL because data entry framework does not exist

**Step 3: Write minimal implementation**

Implement:

- module config loader
- field config loader
- data record persistence
- save and submit actions
- blocking validation execution

**Step 4: Run test to verify it passes**

Run: `pnpm test apps/api/tests/data-entry/data-record-submit.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/config-engine apps/api/src/modules/data-entry apps/web/src/modules/data-entry apps/api/tests/data-entry/data-record-submit.test.ts
git commit -m "feat: add data collection framework"
```

### Task 8: Build Calculation, Chart, And Report Foundations

**Files:**
- Create: `apps/api/src/modules/calculation/calculation.service.ts`
- Create: `apps/api/src/modules/chart/chart.service.ts`
- Create: `apps/api/src/modules/report/report.service.ts`
- Create: `packages/reporting/src/report-template.ts`
- Test: `apps/api/tests/report/report-draft-generation.test.ts`

**Step 1: Write the failing report test**

```ts
it("creates a draft report version from structured project data", async () => {
  const report = await generateDraftReport({ auditProjectId: "proj_1" });
  expect(report.versionType).toBe("system_draft");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/api/tests/report/report-draft-generation.test.ts`
Expected: FAIL because reporting services do not exist

**Step 3: Write minimal implementation**

Implement:

- calculation snapshot generation
- chart configuration execution
- draft report version creation
- file metadata registration

**Step 4: Run test to verify it passes**

Run: `pnpm test apps/api/tests/report/report-draft-generation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/modules/calculation apps/api/src/modules/chart apps/api/src/modules/report packages/reporting apps/api/tests/report/report-draft-generation.test.ts
git commit -m "feat: add calculation and reporting foundation"
```

### Task 9: Build Review And Rectification Workflows

**Files:**
- Create: `apps/api/src/modules/review/review-task.service.ts`
- Create: `apps/api/src/modules/review/review-score.service.ts`
- Create: `apps/api/src/modules/review/review-issue.service.ts`
- Create: `apps/api/src/modules/rectification/rectification.service.ts`
- Create: `apps/web/src/modules/review/pages/review-workbench.tsx`
- Create: `apps/web/src/modules/rectification/pages/rectification-board.tsx`
- Test: `apps/api/tests/review/review-to-rectification.test.ts`

**Step 1: Write the failing workflow test**

```ts
it("creates rectification tasks from confirmed review issues", async () => {
  const tasks = await createRectificationTasksFromIssues(["issue_1"]);
  expect(tasks).toHaveLength(1);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/api/tests/review/review-to-rectification.test.ts`
Expected: FAIL because review and rectification modules do not exist

**Step 3: Write minimal implementation**

Implement:

- task assignment
- score submission
- issue registration
- rectification task generation
- progress updates

**Step 4: Run test to verify it passes**

Run: `pnpm test apps/api/tests/review/review-to-rectification.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/modules/review apps/api/src/modules/rectification apps/web/src/modules/review apps/web/src/modules/rectification apps/api/tests/review/review-to-rectification.test.ts
git commit -m "feat: add review and rectification workflow"
```

### Task 10: Add Integration, Async Jobs, And Operational Hardening

**Files:**
- Create: `apps/api/src/modules/integration/enterprise-info.adapter.ts`
- Create: `apps/api/src/modules/integration/sync-job.service.ts`
- Create: `apps/api/src/modules/jobs/job-runner.ts`
- Create: `apps/api/src/modules/audit-log/audit-log.service.ts`
- Test: `apps/api/tests/integration/enterprise-sync-retry.test.ts`

**Step 1: Write the failing sync retry test**

```ts
it("keeps the last successful enterprise snapshot when external sync fails", async () => {
  const result = await syncEnterprise("ent_1");
  expect(result.mode).toBe("degraded");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/api/tests/integration/enterprise-sync-retry.test.ts`
Expected: FAIL because integration and retry services do not exist

**Step 3: Write minimal implementation**

Implement:

- adapter boundary for enterprise info interface
- sync job records
- retry and degraded mode behavior
- async job runner for reports and batch operations
- audit log recording

**Step 4: Run test to verify it passes**

Run: `pnpm test apps/api/tests/integration/enterprise-sync-retry.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/modules/integration apps/api/src/modules/jobs apps/api/src/modules/audit-log apps/api/tests/integration/enterprise-sync-retry.test.ts
git commit -m "feat: add integration resilience and job framework"
```

### Task 11: Add End-To-End Verification And Delivery Checklist

**Files:**
- Create: `docs/testing/end-to-end-checklist.md`
- Create: `docs/testing/sample-data-seed.md`
- Modify: `docs/plans/2026-03-27-energy-audit-platform-design.md`
- Modify: `docs/plans/2026-03-27-energy-audit-platform-implementation.md`

**Step 1: Write the verification checklist**

Cover:

- enterprise registration and binding
- project creation
- master data setup
- module save and submit
- draft report generation
- review scoring
- rectification closure
- degraded external sync behavior

**Step 2: Define sample data**

Document minimal sample data set for:

- one enterprise
- one batch
- one audit project
- one report
- one review issue
- one rectification task

**Step 3: Run the full validation suite**

Run: `pnpm test`
Expected: PASS

Run: `pnpm type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add docs/testing/end-to-end-checklist.md docs/testing/sample-data-seed.md docs/plans/2026-03-27-energy-audit-platform-design.md docs/plans/2026-03-27-energy-audit-platform-implementation.md
git commit -m "docs: add delivery verification checklist"
```

Plan complete and saved to `docs/plans/2026-03-27-energy-audit-platform-implementation.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**

# Repository Layout

## Goal

仓库采用 monorepo 结构，目标是把平台核心、业务模块、配置引擎、报告能力和基础设施清晰分层，保证：

- 业务主流程由代码模块控制
- 配置能力独立演进
- 前后端共享领域模型和类型约束
- 外部集成与核心业务解耦

## Top-Level Layout

```text
package.json
pnpm-workspace.yaml
turbo.json
tsconfig.base.json
apps/
  api/
  web/
packages/
  config-engine/
  domain/
  integrations/
  reporting/
  shared/
  spreadsheet/
infra/
docs/
scripts/
```

## Workspace And Tooling Baseline

Root-level workspace files should be created in the first scaffolding pass:

- `package.json`
  - root scripts for `dev`, `build`, `test`, `lint`, and `type-check`
- `pnpm-workspace.yaml`
  - workspace package registration for `apps/*` and `packages/*`
- `turbo.json`
  - pipeline definitions for `build`, `test`, `lint`, `type-check`, and app-specific dev tasks
- `tsconfig.base.json`
  - shared TypeScript compiler options and path alias foundations

This gives Task 2 and later tasks an executable monorepo baseline instead of a documentation-only layout.

## Directory Responsibilities

### `apps/api`

Backend application.

Owns:

- HTTP APIs
- domain orchestration
- authentication boundary
- async job consumers
- external sync entrypoints
- persistence wiring

Expected internal layout:

```text
apps/api/src/
  modules/
    audit-batch/
    audit-project/
    enterprise/
    review/
    rectification/
    reporting/
    integration/
    platform/
  db/
    migrations/
  jobs/
```

### `apps/web`

Frontend application for all three ends.

Owns:

- route segmentation for enterprise, manager, reviewer portals
- dashboards and workbenches
- data entry UI
- spreadsheet-backed module shells
- report and task views

Expected internal layout:

```text
apps/web/src/
  app/
  modules/
    enterprise/
    manager/
    reviewer/
    data-entry/
    reports/
    platform/
  components/
  lib/
```

### `packages/domain`

Shared business language and domain contracts.

Owns:

- entity types
- value objects
- state enums
- domain factories
- cross-app business constants

This package should stay free of framework-specific runtime code when possible.

### `packages/spreadsheet`

SpreadJS adapter and abstraction layer.

Owns:

- SpreadJS instance lifecycle management
- workbook template initialization
- business data ↔ SpreadJS cell bidirectional binding
- formula registration and calculation bridge
- SpreadJS events → business events conversion
- Excel/PDF export capabilities

This package isolates all SpreadJS-specific code behind a stable adapter interface so that business modules remain spreadsheet-engine agnostic.

### `packages/config-engine`

Configuration-driven building blocks.

Owns:

- module definitions
- field definitions
- validation rule definitions
- calculation rule definitions
- chart configuration definitions
- template version loaders
- module visibility rules (per business type)

This package does not own the primary workflow; it supports code-controlled workflow.

### `packages/reporting`

Structured output and report assembly support.

Owns:

- report templates
- chart embedding contracts
- output mappers
- document assembly helpers

### `packages/integrations`

Adapter layer for external systems.

Owns:

- enterprise info adapters
- auth provider adapters
- storage adapters
- notification adapters

All external systems should enter through this boundary, not directly from business modules.

### `packages/shared`

Low-level shared utilities.

Owns:

- shared TypeScript types
- constants
- utility helpers
- error primitives

Avoid placing business workflow logic here.

### `infra`

Environment and deployment support.

Owns:

- local development stack definitions
- container setup
- deployment manifests
- environment examples

### `docs`

Project knowledge base.

Owns:

- business design
- ADRs
- implementation plans
- testing runbooks
- operational notes

### `scripts`

Developer and CI helper scripts.

Owns:

- local bootstrap helpers
- code generation helpers
- verification helpers
- import/export tooling wrappers

## Layering Rules

Required dependency direction:

```text
apps/web -> packages/domain | packages/shared | packages/config-engine | packages/reporting | packages/spreadsheet
apps/api -> packages/domain | packages/shared | packages/config-engine | packages/reporting | packages/integrations
packages/integrations -> packages/shared
packages/config-engine -> packages/domain | packages/shared
packages/reporting -> packages/domain | packages/shared
packages/spreadsheet -> packages/domain | packages/shared
packages/domain -> packages/shared
```

Forbidden dependency patterns:

- `packages/domain` must not depend on app code
- `packages/config-engine` must not own workflow state transitions
- `apps/web` must not call external systems directly
- spreadsheet-specific code must not leak into unrelated platform modules

## Initial Build-Out Order

1. `packages/shared`
2. `packages/domain`
3. `packages/config-engine`
4. `packages/reporting`
5. `packages/spreadsheet`
6. `packages/integrations`
7. `apps/api`
8. `apps/web`
9. `infra`

This order aligns with the dependency graph: shared and domain foundations come first, configuration and reporting layers follow, integration adapters stay outside core workflow packages, and apps are scaffolded only after their dependent packages exist.

# Platform Stack ADR

## Status

Accepted

## Context

全市能源审计平台需要支撑以下核心特征：

- 三端业务模型：企业端、管理端、审核端
- 代码控制的主流程：注册、项目、填报、报告、审核、整改
- 配置驱动的字段、模块、规则、图表、报告结构
- 历史项目与模板版本的长期并存
- 报告生成、批量任务、导入导出等异步场景
- 后续接入企业基本信息接口和外部身份体系
- 未来在部分复杂录入模块中集成在线表格能力

系统当前尚未有代码，需优先锁定一个支持渐进式交付、可维护、适合 monorepo 的技术基线。

## Decision

### Frontend framework

- Use `Next.js 16` with `React 19` and `TypeScript`

Why:

- 适合企业端、管理端、审核端统一承载
- 同时支持服务端渲染、后台工作台和受控的客户端复杂表单
- React 生态适合后续集成 SpreadJS 一类在线表格组件
- 便于将鉴权、路由分区、静态资产和管理台统一到单个前端应用中

### Monorepo workspace and build tooling

- Use `pnpm 10` as the package manager
- Use `pnpm workspaces` for repository package boundaries
- Use `Turborepo` for task orchestration, caching, and scoped builds
- Use a root `tsconfig.base.json` for shared TypeScript compiler settings

Why:

- `pnpm` 对 monorepo 的 workspace 支持成熟，安装速度和磁盘复用更适合长期工程
- `pnpm workspaces` 足够直接，不会把当前阶段复杂度抬高到 Nx 一类更重的工具层
- `Turborepo` 能为 Task 2 之后的 `build`、`test`、`lint`、`type-check` 提供可执行基线
- 根级 TypeScript 配置能让共享包、API、Web 在一开始就使用一致的路径和编译约束
- 该组合对 Next.js 和 NestJS 都是低摩擦方案，适合先搭稳平台骨架再逐步扩展

### Backend framework

- Use `NestJS` with the `Fastify` adapter and `TypeScript`

Why:

- 模块化边界适合平台核心、业务模块、集成模块分层建设
- 明确的 controller/service/module 结构更适合长期演进
- Fastify 适合后台 API 与批量任务相关接口的性能要求
- TypeScript 全栈统一，降低领域模型重复定义成本

### Database

- Use `PostgreSQL` as the primary relational database
- Use `Drizzle ORM` plus SQL migrations for schema ownership

Why:

- 平台核心是结构化业务系统，关系模型和历史版本控制是主场景
- PostgreSQL 适合状态流转、审计留痕、配置版本化、报表查询
- Drizzle 保持类型安全，同时允许对关键表结构和 SQL 保持精确控制
- 历史模板、多版本记录、复杂查询不适合 document-first 存储作为主库

### Async job system

- Use `Redis` plus `BullMQ` for background jobs

Why:

- 报告生成、批量导入、批量分派、重计算、接口同步都适合任务队列
- BullMQ 成熟，和 Node/NestJS 组合稳定
- 可明确区分同步请求和后台处理，降低用户等待时间

### Auth strategy

- Use an `OIDC-ready authentication boundary` with `internal RBAC`
- Phase 1 supports local bootstrap login for platform initialization
- Later phases can bind external identity providers without replacing business authorization

Why:

- 用户已明确企业和权限体系需要预留外部系统对接
- 平台仍需保留内部角色、数据范围、项目成员关系
- 外部身份可替换，内部业务授权不能外包

### File storage

- Use `S3-compatible object storage`
- Local development uses `MinIO`
- Production can map to compatible cloud storage

Why:

- 报告、模板、导入文件、整改附件和导出产物都适合对象存储
- 本地可复制，线上可替换，避免一开始与单一云厂商深度耦合

### Online spreadsheet integration strategy

- Use a `feature-isolated spreadsheet adapter`, initially targeting `SpreadJS`
- Restrict spreadsheet usage to complex data-entry modules
- Keep workbook layout mapped by stable field codes
- Never let spreadsheet formulas become the sole system-of-record

Why:

- 在线表格适合二维、多维、复杂录入和局部公式
- 主流程、权限、状态机、审核闭环仍由后端业务系统控制
- 结构化抽取必须依赖稳定字段编码和模板版本，而不是单元格坐标

## Constraints Confirmed

This stack honors the approved design constraints:

- External enterprise-info integration is deferred but reserved through OIDC-ready auth and adapter-based integration boundaries
- History remains version-safe through PostgreSQL relational modeling, template versions, and calculation/report snapshots
- Review and rectification workflows remain code-controlled inside backend domain modules, not delegated to low-code configuration or spreadsheets

## Consequences

### Positive

- 单体 monorepo 起步简单，后续模块化扩展清晰
- 前后端同用 TypeScript，领域模型和接口约束更容易统一
- 在线表格被限制在明确边界内，不会侵入整个平台骨架
- 对外部系统对接保留充足扩展位

### Trade-offs

- Next.js + NestJS 是双应用结构，初期脚手架比单应用略重
- BullMQ 需要 Redis 作为额外基础设施
- Drizzle 需要团队对 SQL 和迁移纪律保持严格控制

### Rejected alternatives

- Full low-code / form-engine-first architecture
  - Rejected because main review, rectification, status, and audit behavior must stay code-controlled
- Spreadsheet-as-platform architecture
  - Rejected because it weakens auditability, history control, and integration boundaries
- Backend-in-frontend-only architecture
  - Rejected because long-running jobs, integrations, and domain boundaries warrant a dedicated API service
- Heavy integrated monorepo tooling such as Nx at project start
  - Rejected because current repository is greenfield and needs an executable but low-friction baseline before introducing heavier orchestration

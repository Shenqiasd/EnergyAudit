# 能源审计平台 — 交付摘要

> 版本: v0.1.0 | 日期: 2026-03-28

---

## 一、平台概述

能源审计平台是面向"十五五"规划期间重点用能单位的市级能源管理系统，覆盖能源审计与节能诊断两大业务类型。平台采用三端模型（企业端、管理端、审核端），实现从企业准入、数据填报、报告生成、审核评分到整改闭环的全流程数字化管理。

### 技术架构

| 层级 | 技术选型 |
|------|----------|
| 前端 | Next.js 16 + React 19 + Tailwind CSS v4 |
| 后端 | NestJS + Fastify + Drizzle ORM |
| 数据库 | PostgreSQL 15+ |
| 异步任务 | BullMQ (Redis 7+) |
| 包管理 | pnpm 10 + Turborepo |
| 语言 | TypeScript (strict mode) |

### 仓库结构

```
energy-audit-platform/
├── apps/
│   ├── api/          # NestJS 后端服务
│   └── web/          # Next.js 前端应用
├── packages/
│   ├── domain/       # 领域模型与实体
│   ├── shared/       # 共享常量与工具
│   ├── config-engine/# 配置引擎（模块/校验/计算）
│   ├── reporting/    # 报告组装引擎
│   ├── integrations/ # 外部集成适配器
│   └── spreadsheet/  # 电子表格适配层
├── docs/             # 文档
├── scripts/          # 工具脚本
└── infra/            # 基础设施配置
```

---

## 二、功能清单

### 全部 13 项任务

| 编号 | 任务 | 波次 | 状态 |
|------|------|------|------|
| Task 1 | 技术架构锁定与仓库布局 | Wave 1 | 已完成 |
| Task 2 | 平台核心骨架初始化 | Wave 1 | 已完成 |
| Task 3 | 核心领域模型与数据库 Schema | Wave 1 | 已完成 |
| Task 4 | 企业管理与外部绑定 | Wave 2 | 已完成 |
| Task 5 | 审计批次与项目生命周期 | Wave 3 | 已完成 |
| Task 6 | 主数据与配置中心 | Wave 2 | 已完成 |
| Task 7 | 24模块数据采集框架 | Wave 4 | 已完成 |
| Task 8 | 计算引擎、图表与报告生成 | Wave 5 | 已完成 |
| Task 9 | 审核与整改工作流 | Wave 6 | 已完成 |
| Task 10 | 集成、异步任务与审计日志 | Wave 6 | 已完成 |
| Task 11 | 端到端验证与交付文档 | Wave 8 | 已完成 |
| Task 12 | 统计分析与决策支持看板 | Wave 7 | 已完成 |
| Task 13 | 平台合并策略（业务类型分化） | Wave 4 | 已完成 |

---

## 三、技术指标

| 指标 | 数值 |
|------|------|
| 总代码行数（TypeScript） | ~30,400+ |
| 后端模块数 | 20 |
| 前端页面数 | 43 |
| 数据库迁移文件 | 9 (001–009) |
| 数据库表数量 | 40+ |
| 单元测试文件 | 24 |
| 单元测试用例 | 240+ |
| 共享包数量 | 6 |

---

## 四、数据库 Schema 概览

### 40+ 表，分为 8 大类

| 分类 | 表名 | 说明 |
|------|------|------|
| **平台核心** | roles, permissions, role_permissions | RBAC 权限模型 |
| | dictionaries | 主数据字典 |
| | templates, template_versions | 模板版本化管理 |
| | attachments | 统一附件存储 |
| | audit_logs | 审计日志 |
| **企业与用户** | enterprises | 企业档案（6状态准入） |
| | enterprise_external_bindings | 外部系统绑定 |
| | user_accounts | 用户账号（三端角色） |
| **业务运行** | audit_batches | 审计批次 |
| | audit_projects | 审计项目（12状态） |
| | project_members | 项目成员 |
| | enterprise_profiles | 企业信息快照 |
| **基础配置** | energy_definitions | 能源品种定义 |
| | product_definitions | 产品定义 |
| | unit_definitions | 用能单元定义 |
| | carbon_emission_factors | 碳排放因子 |
| **数据采集** | data_records | 填报记录（7状态） |
| | data_items | 字段级数据项 |
| | data_modules, data_fields | 模块与字段定义 |
| | validation_rules, validation_results | 校验规则与结果 |
| | calculation_rules, calculation_snapshots | 计算规则与快照 |
| | data_locks | 协同编辑锁 |
| | import_jobs | 数据导入任务 |
| **报告与图表** | reports | 报告（8状态） |
| | report_versions, report_sections | 报告版本与章节 |
| | chart_outputs, chart_configs | 图表输出与配置 |
| | benchmark_values | 对标值 |
| **审核与整改** | review_tasks | 审核任务（7状态） |
| | review_scores | 审核评分（5类别） |
| | review_issues | 审核问题（4级严重程度） |
| | rectification_tasks | 整改任务（7状态） |
| | rectification_progress | 整改进度 |
| **平台运营** | enterprise_applications | 准入申请记录 |
| | sync_logs | 同步日志 |
| | project_status_transitions | 状态转换记录 |
| | project_snapshots | 项目快照 |
| | module_visibility | 模块可见性 |
| | business_type_config | 业务类型配置 |

---

## 五、前端页面清单

### 企业端（Enterprise）— 11 页面

| 路由 | 功能 |
|------|------|
| /enterprise/dashboard | 企业端首页 |
| /enterprise/config | 基础配置入口 |
| /(enterprise)/config/energy | 能源品种定义 |
| /(enterprise)/config/products | 产品定义 |
| /(enterprise)/config/units | 用能单元定义 |
| /enterprise/projects | 项目列表 |
| /enterprise/filing | 填报模块列表 |
| /enterprise/filing/[moduleCode] | 单模块填报页 |
| /enterprise/reports | 报告列表 |
| /enterprise/reports/[id] | 报告详情 |
| /enterprise/rectification | 整改任务列表 |
| /enterprise/rectification/[id] | 整改详情 |

### 管理端（Manager）— 27 页面

| 路由 | 功能 |
|------|------|
| /manager/dashboard | 管理看板（KPI/进度/预警/时间线） |
| /manager/enterprises | 企业列表 |
| /manager/enterprises/[id] | 企业详情 |
| /manager/enterprises/[id]/admission | 准入审核 |
| /manager/batches | 审计批次列表 |
| /manager/batches/[id] | 批次详情 |
| /manager/projects | 项目列表 |
| /manager/projects/[id] | 项目详情 |
| /manager/reviews | 审核管理 |
| /manager/reviews/[id] | 审核详情 |
| /manager/rectifications | 整改督办 |
| /manager/reports | 报告管理 |
| /manager/statistics | 统计分析 |
| /manager/ledgers | 台账管理 |
| /manager/ledgers/enterprise | 企业台账 |
| /manager/ledgers/review | 审核台账 |
| /manager/ledgers/rectification | 整改台账 |
| /manager/business-types | 业务类型配置 |
| /manager/calculations | 计算管理 |
| /manager/data-overview | 数据概览 |
| /manager/audit-logs | 审计日志 |
| /manager/jobs | 异步任务 |
| /manager/sync | 同步管理 |
| /manager/users | 用户管理 |
| /(manager)/carbon-factors | 碳排放因子 |
| /(manager)/dictionaries | 字典管理 |

### 审核端（Reviewer）— 3 页面

| 路由 | 功能 |
|------|------|
| /reviewer/tasks | 审核任务列表 |
| /reviewer/tasks/[id] | 审核工作台 |
| /reviewer/history | 审核历史 |

---

## 六、API 端点清单

### 后端 19 个控制器

| 模块 | 控制器 | 主要端点 |
|------|--------|----------|
| attachment | AttachmentController | 文件上传/下载 |
| audit-batch | AuditBatchController | 批次 CRUD、激活 |
| audit-log | AuditLogController | 日志查询 |
| audit-project | AuditProjectController | 项目 CRUD、状态转换、成员管理 |
| business-type | BusinessTypeController | 业务类型配置、模块可见性 |
| calculation | CalculationController | 计算触发、快照查询 |
| chart | ChartController | 图表生成与查询 |
| data-entry | DataEntryController | 数据 CRUD、提交、校验、锁管理 |
| enterprise | EnterpriseController | 企业 CRUD、准入审核、同步 |
| health | HealthController | 服务健康检查 |
| integration | IntegrationController | 同步任务、降级状态 |
| jobs | JobController | 异步任务管理 |
| ledger | LedgerController | 台账查询与导出 |
| master-data | MasterDataController | 能源/产品/单元/碳因子 CRUD |
| rectification | RectificationController | 整改任务管理、进度更新 |
| report | ReportController | 报告生成、版本管理、下载 |
| review | ReviewController | 审核任务、评分、问题登记 |
| statistics | StatisticsController | 批次/行业/碳排放统计 |
| user | UserAccountController | 用户管理、角色分配 |

---

## 七、共享包

| 包名 | 说明 |
|------|------|
| @energy-audit/domain | 领域实体、状态机常量、工厂函数 |
| @energy-audit/shared | 平台角色、共享工具函数 |
| @energy-audit/config-engine | 模块定义、校验规则、计算规则、字段配置 |
| @energy-audit/reporting | 报告模板、章节映射、组装引擎 |
| @energy-audit/integrations | 外部系统适配器（企业信息、认证、存储） |
| @energy-audit/spreadsheet | SpreadJS 适配层 |

---

## 八、已知限制

1. **SpreadJS 集成**: 当前使用基础表单组件进行数据填报，SpreadJS 在线表格集成为预留接口，需商业授权后接入
2. **实时协作**: 协同编辑锁采用数据库轮询方式，未实现 WebSocket 实时通知
3. **移动端适配**: 响应式设计以桌面端为主，移动端体验有待优化
4. **认证系统**: 当前为模拟认证，需对接实际 OAuth/OIDC 认证服务（如 Keycloak）
5. **外部企业接口**: 企业基本信息接口已预留适配器，需对接实际政府数据接口
6. **报告排版**: 报告组装为结构化数据输出，精排版需对接文档生成服务（如 wkhtmltopdf）

---

## 九、未来路线图

### 短期（1-2个月）

- 对接外部企业基本信息接口
- 对接认证服务（Keycloak/OIDC）
- 报告 PDF 精排版输出
- 数据导入模板优化

### 中期（3-6个月）

- SpreadJS 在线表格集成
- WebSocket 实时协作通知
- 移动端响应式优化
- 性能监控与 APM 接入

### 长期（6-12个月）

- 多区域部署与数据隔离
- AI 辅助能效分析
- 大屏数据可视化
- 与碳交易平台对接

---

## 十、交付物清单

| 类型 | 内容 | 路径 |
|------|------|------|
| 源代码 | 全部 13 项任务实现 | apps/, packages/ |
| 数据库迁移 | 9 个迁移文件 | apps/api/src/db/migrations/ |
| 测试套件 | 24 个测试文件，240+ 测试用例 | apps/api/tests/ |
| 设计文档 | 业务设计文档 | docs/plans/ |
| 实施计划 | 实施计划文档 | docs/plans/ |
| 架构决策 | ADR 文档 | docs/adr/ |
| 架构文档 | 仓库布局说明 | docs/architecture/ |
| 测试文档 | 端到端测试清单 | docs/testing/end-to-end-checklist.md |
| 测试文档 | 验收标准 | docs/testing/acceptance-criteria.md |
| 部署文档 | 部署指南 | docs/deployment/deployment-guide.md |
| 交付文档 | 交付摘要（本文档） | docs/delivery-summary.md |
| 工具脚本 | 示例数据种子脚本 | scripts/seed-sample-data.ts |
| 部署配置 | Dockerfile (API + Web) | apps/api/Dockerfile, apps/web/Dockerfile |
| 部署配置 | Railway 配置 | Procfile, nixpacks.toml |

# EnergyAudit 能源审计平台

全市能源审计业务管理系统，支撑企业能源数据采集、审计报告生成、专家审核、整改跟踪的全生命周期管理。

## 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React 19)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  企业端 SPA   │  │  管理端 SPA   │  │    审核端 SPA        │  │
│  │  /enterprise  │  │  /manager     │  │    /reviewer         │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│  ┌──────┴─────────────────┴──────────────────────┴───────────┐  │
│  │               Next.js 16 App Router                       │  │
│  │  TanStack Query + Zustand + Tailwind CSS v4              │  │
│  └──────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │ REST API (JSON) + JWT Auth
┌─────────────────────────────┼───────────────────────────────────┐
│  ┌──────────────────────────┴────────────────────────────────┐  │
│  │             NestJS 11 + Fastify 5 Adapter                 │  │
│  │  Global: ValidationPipe | JwtAuthGuard | RolesGuard       │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │                   22 Business Modules                     │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │               Drizzle ORM (Type-Safe SQL)                 │  │
│  └──────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
           ┌──────────────────┼──────────────────┐
    ┌──────┴──────┐   ┌──────┴──────┐   ┌──────┴──────┐
    │ PostgreSQL  │   │   Redis     │   │ S3/MinIO    │
    │  48+ 表     │   │  BullMQ     │   │ 文件存储     │
    └─────────────┘   └─────────────┘   └─────────────┘
```

## 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| **前端** | Next.js + React + TypeScript | 16.2 / 19.2 / 5.9 |
| **样式** | Tailwind CSS v4 | 4.2 |
| **状态管理** | TanStack React Query + Zustand | 5.95 / 5.0 |
| **后端** | NestJS + Fastify | 11.1 / 5.8 |
| **ORM** | Drizzle ORM + postgres.js | 0.45 |
| **认证** | Passport JWT + bcrypt | - |
| **数据库** | PostgreSQL | - |
| **异步任务** | Redis + BullMQ | - |
| **文件存储** | S3/MinIO | - |
| **构建** | pnpm + Turborepo | 10.17 / 2.5 |
| **文档生成** | pdfkit + docx | - |
| **测试** | Vitest | 3.2 |

## 三端业务模型

| 端 | 角色 | 核心职责 |
|---|---|---|
| **企业端** | `enterprise_user` | 企业配置、数据填报(24模块)、报告查看、整改执行 |
| **管理端** | `manager` | 批次管理、企业准入、项目生命周期、审核分派、统计分析、台账管理 |
| **审核端** | `reviewer` | 审核任务执行、评分、问题登记、整改验收 |

## 项目结构

```
├── apps/
│   ├── api/                        # NestJS 后端 (22 模块, 48+ 数据库表)
│   │   └── src/
│   │       ├── main.ts             # 入口: Fastify + ValidationPipe + CORS
│   │       ├── app.module.ts       # 根模块: 22 个业务模块
│   │       ├── common/             # 全局守卫/过滤器/拦截器
│   │       ├── db/                 # Drizzle schema + 16 个 SQL 迁移
│   │       └── modules/            # 业务模块
│   │           ├── auth/           # JWT 认证 + 角色守卫
│   │           ├── enterprise/     # 企业管理 + 准入状态机
│   │           ├── master-data/    # 主数据配置中心
│   │           ├── audit-batch/    # 审计批次
│   │           ├── audit-project/  # 项目生命周期 (12状态)
│   │           ├── data-entry/     # 数据采集 + 5层校验 + 协同锁
│   │           ├── calculation/    # 计算引擎 (能耗/碳排放)
│   │           ├── chart/          # 图表生成 (饼图/柱图/Sankey)
│   │           ├── report/         # 报告管理 + 版本控制 (8状态)
│   │           ├── review/         # 审核工作流 (7状态) + 评分
│   │           ├── rectification/  # 整改工作流 (7状态)
│   │           ├── statistics/     # 统计分析 (批次/行业/碳排放/区域)
│   │           ├── ledger/         # 台账管理 + CSV 导出
│   │           ├── notification/   # 消息通知 + 事件触发
│   │           ├── export/         # PDF/Word 导出
│   │           ├── integration/    # 外部系统同步
│   │           ├── jobs/           # 异步任务 + 超期扫描
│   │           ├── business-type/  # 业务类型配置
│   │           ├── audit-log/      # 操作日志
│   │           ├── attachment/     # 文件附件
│   │           ├── user/           # 用户管理
│   │           └── health/         # 健康检查
│   │
│   └── web/                        # Next.js 前端 (50+ 页面)
│       └── src/
│           ├── app/
│           │   ├── login/          # 登录页
│           │   ├── enterprise/     # 企业端 (工作台/填报/报告/整改/通知)
│           │   ├── manager/        # 管理端 (看板/企业/批次/项目/审核/统计/台账)
│           │   └── reviewer/       # 审核端 (任务/历史/通知)
│           ├── components/
│           │   ├── ui/             # 基础组件 (Button/Card/Table/Modal/...)
│           │   ├── layout/         # AppShell + Sidebar + Header
│           │   ├── charts/         # SVG 图表 (饼图/柱图/Sankey/对标/区域)
│           │   ├── dashboard/      # KPI卡片/进度板/预警/时间线
│           │   ├── data-entry/     # 例外提交/导入回滚对话框
│           │   └── notification/   # 通知铃铛/面板/列表
│           └── lib/
│               ├── api/            # API 客户端 + 24 个 React Query hooks
│               ├── auth/           # AuthProvider + useAuth
│               └── draft-storage.ts # 离线草稿管理
│
├── packages/
│   ├── config-engine/              # 配置驱动引擎 (60+ 导出)
│   ├── domain/                     # 领域模型 (27 个实体类型)
│   ├── integrations/               # 外部适配器 (企业信息/文件存储)
│   ├── reporting/                  # 报告模板 + 图表渲染 + Sankey
│   └── shared/                     # 共享常量 + 角色 + 状态机定义
│
├── docs/                           # 项目文档 (架构/ADR/计划/部署/测试)
├── scripts/                        # 工具脚本 (种子数据)
└── tests/                          # 集成测试
```

## 核心功能

### 认证授权
- JWT 认证 (AccessToken 30min + RefreshToken 7d)
- 全局 `JwtAuthGuard` + `RolesGuard` 守卫
- `@Public()` / `@Roles()` 装饰器
- 企业数据范围隔离 (`EnterpriseScopeGuard`)
- bcrypt 密码哈希

### 数据采集框架
- 24 个填报模块（配置驱动）
- 5 层校验引擎：必填 → 字段 → 跨字段 → 跨模块 → 完整性
- 计算引擎：依赖图拓扑排序 + 公式执行
- 协同编辑锁（乐观锁 + TTL 自动释放）
- 受控例外机制（提交/审批/驳回）
- 离线草稿（localStorage 自动保存 30s 间隔）
- 导入回滚（导入前快照 + 24h 内回滚）

### 6 组状态机

| 状态机 | 状态数 | 说明 |
|---|---|---|
| 企业准入 | 6 | pending_review → approved / rejected / suspended / locked / expired |
| 审计项目 | 12 | pending_start → ... → completed → closed |
| 填报记录 | 7 | draft → saved → submitted / returned / archived |
| 审计报告 | 8 | not_generated → draft_generated → ... → archived / voided |
| 审核任务 | 7 | pending_assignment → assigned → in_review → completed / closed |
| 整改任务 | 7 | pending_issue → pending_claim → in_progress → completed / closed |

### 报告系统
- 8 章节标准模板自动组装
- 报告版本管理（版本历史 + 活跃版本切换）
- 企业信息快照（项目创建时自动生成）
- PDF 导出 (pdfkit) + Word 导出 (docx)
- SVG 图表嵌入（能源结构饼图 / 趋势柱图 / Sankey 能源流图）

### 审核与整改
- 审核任务分派 + 7 状态流转
- 5 类别评分（数据质量/分析深度/建议可行性/格式规范/综合评价）
- 问题登记（4 级严重度 + 整改标记）
- 整改任务自动生成 + 进度跟踪 + 闭环验收

### 统计分析与台账
- 管理端首页看板（KPI 卡片 + 进度板 + 预警列表 + 活动时间线）
- 多维度统计：批次 / 行业 / 碳排放 / 区域
- 能效对标分析（基准管理 + 企业对比）
- 三类台账管理（企业/审核/整改）+ CSV 导出

### 配置引擎
- 4 层配置覆盖：平台 → 批次模板 → 企业类型 → 企业
- 模块可见性控制（按业务类型）
- 双业务类型预留：能源审计 + 节能诊断

### 消息通知
- 业务事件自动触发通知（项目/审核/整改/报告状态变更）
- 三端消息页面 + 通知铃铛 + 未读计数

### 超期预警
- BullMQ 定时扫描 + `isOverdue` 标记
- 统计预警联动 + 延期操作

## 快速开始

### 环境要求

- Node.js (ES2022+)
- pnpm 10+
- PostgreSQL
- Redis（用于 BullMQ 异步任务）

### 安装与启动

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp apps/api/.env.example apps/api/.env
# 编辑 .env 设置 DATABASE_URL, JWT_SECRET 等

# 执行数据库迁移
pnpm --filter @energy-audit/api migrate

# 种子样本数据
pnpm seed:sample

# 启动开发服务 (API: 3001, Web: 3000)
pnpm dev
```

### 常用命令

```bash
pnpm dev           # 同时启动 API + Web 开发服务
pnpm build         # 构建全部
pnpm test          # 运行全部测试 (260+ 单元测试)
pnpm lint          # ESLint 代码检查
pnpm type-check    # TypeScript 类型检查
pnpm seed:sample   # 导入样本数据
```

### 环境变量

| 变量 | 用途 | 默认值 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接串 | - |
| `JWT_SECRET` | JWT Access Token 密钥 | `dev-jwt-secret-change-in-production` |
| `JWT_REFRESH_SECRET` | JWT Refresh Token 密钥 | - |
| `API_PORT` | API 服务端口 | `3001` |
| `NEXT_PUBLIC_API_URL` | 前端 API 地址 | `/api/v1` |
| `REDIS_URL` | Redis 连接串 | `redis://localhost:6379` |

## API 端点

所有 API 统一前缀: `/api/v1`

| 模块 | 方法 | 路径 | 说明 |
|---|---|---|---|
| Auth | POST | `/auth/login` | 登录 |
| Auth | POST | `/auth/register` | 注册 |
| Auth | POST | `/auth/refresh` | 刷新 Token |
| Enterprise | GET | `/enterprises` | 企业列表 |
| Enterprise | POST | `/enterprises/:id/admit` | 准入审核 |
| AuditBatch | POST | `/audit-batches` | 创建批次 |
| AuditProject | GET | `/audit-projects` | 项目列表 |
| AuditProject | PATCH | `/audit-projects/:id/transition` | 状态变更 |
| DataEntry | GET | `/data-entry/projects/:id/records` | 填报记录 |
| DataEntry | PUT | `/data-entry/records/:id` | 保存数据 |
| DataEntry | POST | `/data-entry/records/:id/submit` | 提交填报 |
| Calculation | POST | `/calculations/projects/:id/trigger` | 触发计算 |
| Report | POST | `/reports/projects/:id/generate` | 生成报告 |
| Review | POST | `/reviews` | 创建审核任务 |
| Rectification | GET | `/rectifications` | 整改列表 |
| Statistics | GET | `/statistics/dashboard` | 看板数据 |
| Ledger | GET | `/ledgers/enterprises` | 企业台账 |
| Export | GET | `/export/reports/:id/pdf` | PDF 导出 |
| Notification | GET | `/notifications` | 消息列表 |

## 数据库

- **ORM**: Drizzle ORM（类型安全）
- **表数量**: 48+
- **迁移文件**: 16 个 SQL 迁移
- **Schema 定义**: `apps/api/src/db/schema/index.ts` (912 行)

主要表分组:

| 分组 | 包含表 |
|---|---|
| **平台核心** | roles, permissions, dictionaries, templates, attachments, audit_logs |
| **企业与用户** | enterprises, user_accounts, enterprise_applications |
| **业务运行** | audit_batches, audit_projects, project_members, enterprise_profiles |
| **数据采集** | data_records, data_items, data_modules, data_fields, validation_rules, calculation_rules |
| **结果输出** | reports, report_versions, chart_outputs, review_tasks, review_scores, rectification_tasks |
| **配置与系统** | config_overrides, validation_exceptions, benchmark_values, notifications |

## 共享包

| 包 | 说明 | 导出数 |
|---|---|---|
| `@energy-audit/config-engine` | 配置驱动引擎: 模块可见性/字段配置/5层校验/计算规则/4层覆盖 | 60+ |
| `@energy-audit/domain` | 领域模型: 27 个实体类型（前后端共享） | 76+ |
| `@energy-audit/reporting` | 报告模板 + 图表渲染器 + Sankey 构建器 | 27+ |
| `@energy-audit/integrations` | 外部适配器: 企业信息/文件存储（可替换） | 10+ |
| `@energy-audit/shared` | 共享常量: 角色/状态机/业务类型 | - |

## 部署

### Docker

```bash
docker build -f apps/api/Dockerfile -t energy-audit-api .
docker build -f apps/web/Dockerfile -t energy-audit-web .
```

### Railway / 云平台

```bash
# API
pnpm --filter @energy-audit/api start:prod

# Web
HOSTNAME=0.0.0.0 node .next/standalone/apps/web/server.js
```

## 文档

- [架构设计](docs/architecture/repository-layout.md)
- [技术栈 ADR](docs/adr/2026-03-27-platform-stack.md)
- [实施计划](docs/plans/)
- [部署指南](docs/deployment/)
- [E2E 测试清单](docs/testing/end-to-end-checklist.md)
- [验收标准](docs/testing/acceptance-criteria.md)
- [交付总结](docs/delivery-summary.md)

## 项目统计

| 指标 | 数值 |
|---|---|
| 后端模块 | 22 |
| 前端页面 | 50+ |
| 数据库表 | 48+ |
| SQL 迁移 | 16 |
| 状态机 | 6 组 (6-12 状态) |
| React Query Hooks | 24 |
| 单元测试 | 260+ |
| 共享包 | 5 |
| 已合并 PR | 28 |

## License

Private

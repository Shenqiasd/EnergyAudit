# 部署指南

> 本文档描述能源审计平台的部署流程，包括环境要求、数据库配置、服务启动和初始化步骤。

---

## 一、环境要求

| 组件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | ≥ 22.x | 运行时环境 |
| pnpm | ≥ 10.x | 包管理器（通过 `corepack enable` 启用） |
| PostgreSQL | ≥ 15.x | 主数据库 |
| Redis | ≥ 7.x | BullMQ 异步任务队列 |
| S3 兼容存储 | - | 附件与报告文件存储（MinIO / AWS S3 / 阿里云 OSS） |

---

## 二、环境变量

在部署前，需配置以下环境变量：

```bash
# ============ 数据库 ============
DATABASE_URL=postgresql://user:password@host:5432/energy_audit

# ============ Redis ============
REDIS_URL=redis://host:6379

# ============ API 服务 ============
API_PORT=3001
API_HOST=0.0.0.0
NODE_ENV=production

# ============ Web 前端 ============
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# ============ 对象存储 ============
S3_ENDPOINT=https://s3.your-region.amazonaws.com
S3_BUCKET=energy-audit-files
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_REGION=your-region

# ============ 认证（预留） ============
# AUTH_PROVIDER=keycloak
# AUTH_ISSUER_URL=https://auth.your-domain.com/realms/energy-audit
# AUTH_CLIENT_ID=energy-audit-api

# ============ 外部集成（预留） ============
# ENTERPRISE_INFO_API_URL=https://enterprise-info.gov.cn/api
# ENTERPRISE_INFO_API_KEY=your-api-key
```

---

## 三、数据库配置

### 3.1 创建数据库

```sql
CREATE DATABASE energy_audit
  WITH ENCODING = 'UTF8'
       LC_COLLATE = 'zh_CN.UTF-8'
       LC_CTYPE = 'zh_CN.UTF-8'
       TEMPLATE = template0;

CREATE USER energy_audit_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE energy_audit TO energy_audit_user;
```

### 3.2 执行数据库迁移

迁移文件位于 `apps/api/src/db/migrations/`，共 9 个文件：

| 序号 | 文件名 | 说明 |
|------|--------|------|
| 001 | `001_init_core_schema.sql` | 核心 Schema（角色、字典、企业、用户、批次、项目、填报、报告、审核、整改等 30+ 表） |
| 002 | `002_enterprise_admission.sql` | 企业准入流程（申请记录、同步日志） |
| 003 | `003_project_lifecycle.sql` | 项目生命周期（状态转换记录、快照） |
| 004 | `004_master_data.sql` | 主数据扩展（碳排放因子增强） |
| 005 | `005_data_collection.sql` | 数据采集框架（模块定义、字段定义、校验规则、计算规则、数据锁） |
| 006 | `006_reporting.sql` | 报告扩展（版本管理、章节、图表配置、对标值） |
| 007 | `007_review_rectification.sql` | 审核与整改扩展（预留，核心表已在 001 中创建） |
| 008 | `008_integration_jobs.sql` | 集成与异步任务（预留扩展） |
| 009 | `009_business_type.sql` | 业务类型（模块可见性、业务类型配置） |

执行迁移：

```bash
# 方式一：使用内置迁移脚本
cd apps/api
DATABASE_URL=postgresql://user:password@host:5432/energy_audit pnpm migrate

# 方式二：手动按顺序执行
psql $DATABASE_URL -f apps/api/src/db/migrations/001_init_core_schema.sql
psql $DATABASE_URL -f apps/api/src/db/migrations/002_enterprise_admission.sql
psql $DATABASE_URL -f apps/api/src/db/migrations/003_project_lifecycle.sql
psql $DATABASE_URL -f apps/api/src/db/migrations/004_master_data.sql
psql $DATABASE_URL -f apps/api/src/db/migrations/005_data_collection.sql
psql $DATABASE_URL -f apps/api/src/db/migrations/006_reporting.sql
psql $DATABASE_URL -f apps/api/src/db/migrations/007_review_rectification.sql
psql $DATABASE_URL -f apps/api/src/db/migrations/008_integration_jobs.sql
psql $DATABASE_URL -f apps/api/src/db/migrations/009_business_type.sql
```

> **注意：** 内置迁移脚本会自动跟踪已执行的迁移，避免重复执行。

---

## 四、Redis 配置

Redis 用于 BullMQ 异步任务队列，处理报告生成、批量导入等后台任务。

```bash
# 确认 Redis 可连接
redis-cli -u $REDIS_URL ping
# 预期输出: PONG
```

---

## 五、存储配置

附件和报告文件存储在 S3 兼容的对象存储中。

### MinIO（本地开发）

```bash
docker run -d \
  --name minio \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# 创建存储桶
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/energy-audit-files
```

---

## 六、构建与启动

### 6.1 安装依赖

```bash
pnpm install
```

### 6.2 构建项目

```bash
pnpm build
```

### 6.3 启动服务

```bash
# API 服务
cd apps/api
NODE_ENV=production node dist/main

# Web 前端
cd apps/web
NODE_ENV=production pnpm start
```

### 6.4 开发模式

```bash
pnpm dev
```

---

## 七、初始管理员账号

首次部署后，需创建初始管理员账号。可通过种子脚本或直接 SQL 操作：

### 方式一：种子脚本

```bash
DATABASE_URL=postgresql://user:password@host:5432/energy_audit pnpm seed:sample
```

### 方式二：SQL 插入

```sql
INSERT INTO user_accounts (id, email, name, phone, role, status)
VALUES (
  gen_random_uuid()::text,
  'admin@energy-audit.gov.cn',
  '系统管理员',
  '13900000000',
  'manager',
  'active'
);
```

---

## 八、Docker 部署

### 8.1 API 服务

```dockerfile
# apps/api/Dockerfile（已存在于项目中）
FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile && pnpm build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main"]
```

### 8.2 Web 前端

```dockerfile
# apps/web/Dockerfile（已存在于项目中）
FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter @energy-audit/web build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/package.json ./
EXPOSE 3000
CMD ["pnpm", "start"]
```

### 8.3 Docker Compose

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: energy_audit
      POSTGRES_USER: energy_audit_user
      POSTGRES_PASSWORD: your-secure-password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      DATABASE_URL: postgresql://energy_audit_user:your-secure-password@postgres:5432/energy_audit
      REDIS_URL: redis://redis:6379
      API_PORT: "3001"
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://api:3001
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  pgdata:
```

---

## 九、Railway 部署

项目已配置 Railway 部署支持：

- `Procfile` — 进程定义
- `nixpacks.toml` — Nixpacks 构建配置

### 部署步骤

1. 在 Railway 中创建新项目
2. 连接 GitHub 仓库
3. 添加 PostgreSQL 和 Redis 插件
4. 配置环境变量（参见第二节）
5. 部署完成后执行数据库迁移

---

## 十、健康检查

部署完成后，验证服务状态：

```bash
# API 健康检查
curl http://localhost:3001/health

# Web 前端
curl http://localhost:3000
```

---

## 十一、常见问题

### Q: 迁移执行失败怎么办？

A: 检查 `_migrations` 表确认已执行的迁移，修复问题后重新执行失败的迁移文件。

### Q: 如何重置数据库？

A: 删除数据库后重新创建并执行全部迁移：
```bash
dropdb energy_audit
createdb energy_audit
pnpm --filter @energy-audit/api migrate
```

### Q: Redis 连接失败会影响什么？

A: Redis 用于异步任务队列，连接失败会导致报告生成、批量导入等后台任务无法执行，但不影响核心 CRUD 操作。

# Railway 部署指南

本文档说明如何将 EnergyAudit 平台（API + Web）部署到 [Railway](https://railway.com)。

## 架构概览

Railway 上需要创建 **3 个服务**：

| 服务 | 说明 | 端口 |
|---|---|---|
| **PostgreSQL** | Railway 托管的 PostgreSQL 数据库 | 自动分配 |
| **API** | NestJS 后端（`apps/api`） | 3001 |
| **Web** | Next.js 前端（`apps/web`） | 3000 |

```
┌──────────┐     ┌──────────┐     ┌────────────┐
│   Web    │────▶│   API    │────▶│ PostgreSQL │
│ (Next.js)│     │ (NestJS) │     │            │
└──────────┘     └──────────┘     └────────────┘
   :3000            :3001
```

Web 通过 Next.js rewrites 将 `/api/*` 请求代理到 API 服务（Railway 内网通信）。

---

## 一键部署步骤

### 1. 创建 Railway 项目

1. 登录 [Railway Dashboard](https://railway.com/dashboard)
2. 点击 **+ New Project** → **Empty Project**
3. 重命名项目为 `EnergyAudit`

### 2. 添加 PostgreSQL 数据库

1. 在项目画布中，点击 **+ Create** → **Database** → **Add PostgreSQL**
2. 等待数据库服务就绪
3. 点击 PostgreSQL 服务，在 **Variables** 标签页中记下 `DATABASE_URL`

### 3. 创建 API 服务

1. 点击 **+ Create** → **Empty Service**，命名为 `API`
2. **Settings** 标签页：
   - **Source**: 连接你的 GitHub 仓库 `Shenqiasd/EnergyAudit`
   - **Builder**: 选择 `Dockerfile`
   - **Dockerfile Path**: `apps/api/Dockerfile`
   - **Watch Paths**: `/apps/api/**`, `/packages/**`
3. **Variables** 标签页，添加以下变量：

   | 变量名 | 值 |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` （引用 PostgreSQL 服务） |
   | `API_PORT` | `3001` |
   | `NODE_ENV` | `production` |
   | `PORT` | `3001` |

4. **Settings** → **Networking**：
   - 生成一个 **Public Domain**（用于外部测试）
   - 记下 **Private Domain**，格式类似 `api.railway.internal`

### 4. 创建 Web 服务

1. 点击 **+ Create** → **Empty Service**，命名为 `Web`
2. **Settings** 标签页：
   - **Source**: 连接同一个 GitHub 仓库 `Shenqiasd/EnergyAudit`
   - **Builder**: 选择 `Dockerfile`
   - **Dockerfile Path**: `apps/web/Dockerfile`
   - **Watch Paths**: `/apps/web/**`, `/packages/**`
3. **Variables** 标签页，添加以下变量：

   | 变量名 | 值 | 说明 |
   |---|---|---|
   | `INTERNAL_API_URL` | `http://api.railway.internal:3001` | **构建时变量**，使用 API 服务的 Private Domain |
   | `PORT` | `3000` | |
   | `NODE_ENV` | `production` | |

   > **重要提示**：`INTERNAL_API_URL` 是构建时变量（build-time variable）。Next.js 的 rewrites 配置在 `next build` 时被烘焙到构建产物中。Railway 会自动将服务变量注入到 Docker 构建环境中，因此只需在 Variables 中设置即可。如果修改了 API 的 Private Domain，需要触发 Web 服务的重新构建。

4. **Settings** → **Networking**：
   - 生成一个 **Public Domain**（这是用户访问的入口）

### 5. 部署

点击 **Deploy** 按钮，Railway 会自动：
1. 从 GitHub 拉取代码
2. 使用 Dockerfile 构建各服务
3. 启动服务

### 6. 运行数据库迁移

首次部署后，需要运行数据库迁移。在 API 服务的 **Settings** 中：

**方法 A**：通过 Railway CLI
```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 链接到 API 服务
railway link

# 运行迁移
railway run pnpm --filter @energy-audit/api run migrate
```

**方法 B**：修改 API 的启动命令为带迁移的命令（仅首次）
在 API 服务的 Settings 中，临时修改 **Start Command** 为：
```
node apps/api/dist/db/migrate.js && node apps/api/dist/main.js
```
迁移完成后改回 `node apps/api/dist/main.js`

---

## 环境变量汇总

### API 服务

| 变量名 | 说明 | 示例值 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `${{Postgres.DATABASE_URL}}` |
| `API_PORT` | API 监听端口 | `3001` |
| `NODE_ENV` | 运行环境 | `production` |

### Web 服务

| 变量名 | 说明 | 示例值 |
|---|---|---|
| `INTERNAL_API_URL` | API 内网地址 | `http://api.railway.internal:3001` |
| `PORT` | Web 监听端口 | `3000` |
| `NODE_ENV` | 运行环境 | `production` |

---

## 内网通信说明

Railway 支持服务间通过 **Private Networking** 通信：
- Web 服务使用 `INTERNAL_API_URL` 通过内网调用 API（零延迟、免费流量）
- 格式：`http://<service-name>.railway.internal:<port>`
- Next.js 的 `rewrites` 配置会将浏览器的 `/api/*` 请求代理到内网 API

---

## 后续部署

- 每次推送到 main 分支，Railway 会自动重新部署
- 可以在 Settings 中配置 **Watch Paths** 避免无关代码变更触发不必要的重建
- API: `/apps/api/**`, `/packages/**`
- Web: `/apps/web/**`, `/packages/**`

---

## 故障排查

1. **API 无法连接数据库**：检查 `DATABASE_URL` 变量是否正确引用了 PostgreSQL 服务
2. **Web 无法调用 API**：检查 `INTERNAL_API_URL` 是否指向 API 的 Private Domain
3. **构建失败**：查看 Railway 的 Build Logs，常见问题是 pnpm 版本或依赖安装
4. **健康检查失败**：确认 API 的 `/api/v1/health` 端点可访问

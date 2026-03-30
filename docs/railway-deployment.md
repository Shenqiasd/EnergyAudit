# Railway 部署指南（零基础版）

本文档面向完全不懂运维的人员，手把手教你将 EnergyAudit 能源审计平台部署到 [Railway](https://railway.com)。

---

## 目录

1. [架构说明](#架构说明)
2. [前置准备](#前置准备)
3. [第一步：创建 Railway 项目](#第一步创建-railway-项目)
4. [第二步：添加 PostgreSQL 数据库](#第二步添加-postgresql-数据库)
5. [第三步：创建 API 服务](#第三步创建-api-服务)
6. [第四步：创建 Web 服务](#第四步创建-web-服务)
7. [第五步：配置服务间网络](#第五步配置服务间网络)
8. [第六步：触发部署](#第六步触发部署)
9. [第七步：验证部署](#第七步验证部署)
10. [环境变量完整清单](#环境变量完整清单)
11. [常见问题排查](#常见问题排查)
12. [日常维护](#日常维护)

---

## 架构说明

整个平台在 Railway 上由 **3 个服务** 组成：

```
用户浏览器
    │
    ▼
┌──────────┐  Railway 内网   ┌──────────┐  Railway 内网   ┌────────────┐
│   Web    │ ──────────────▶ │   API    │ ──────────────▶ │ PostgreSQL │
│ (前端)    │                 │ (后端)    │                 │  (数据库)   │
│ Next.js  │                 │ NestJS   │                 │            │
└──────────┘                 └──────────┘                 └────────────┘
  公网域名                    公网域名(可选)                  仅内网访问
```

- **PostgreSQL**：Railway 托管的数据库，无需手动管理
- **API**：NestJS 后端，连接数据库，提供 REST API
- **Web**：Next.js 前端，用户通过浏览器访问，自动将 `/api/*` 请求转发给 API

> **关键概念**：Web 和 API 之间通过 Railway 的「内网」通信，速度快且免费。用户只需访问 Web 的公网域名即可使用整个平台。

---

## 前置准备

你需要准备以下内容：

| 项目 | 说明 |
|---|---|
| Railway 账号 | 前往 https://railway.com 注册（支持 GitHub 登录） |
| GitHub 仓库 | 本项目的 GitHub 仓库（`Shenqiasd/EnergyAudit`） |
| Railway 付费计划 | **Trial 计划**即可开始，但资源有限。推荐 **Hobby ($5/月)** 或更高计划 |

> **注意**：Railway 的免费 Trial 计划有 500 小时和 $5 额度限制。如果服务频繁重启可能很快耗尽。建议升级到 Hobby 计划。

---

## 第一步：创建 Railway 项目

1. 打开 [Railway Dashboard](https://railway.com/dashboard)
2. 点击右上角 **+ New Project**
3. 选择 **Empty Project**（空项目）
4. 项目创建后，点击项目名称可以重命名为 `EnergyAudit`

你现在应该看到一个空白的项目画布。

---

## 第二步：添加 PostgreSQL 数据库

1. 在项目画布中，点击 **+ Create**（右上角加号）
2. 选择 **Database** → **Add PostgreSQL**
3. 等待约 30 秒，PostgreSQL 服务会出现在画布上
4. **不需要做其他配置** — Railway 会自动管理数据库

> 数据库创建后，Railway 会自动生成连接信息（DATABASE_URL 等）。后面的 API 服务会引用这些信息。

---

## 第三步：创建 API 服务

### 3.1 创建服务并连接 GitHub

1. 在项目画布中，点击 **+ Create** → **GitHub Repo**
2. 搜索并选择你的仓库 `Shenqiasd/EnergyAudit`
3. Railway 会自动创建一个新服务

### 3.2 重命名服务

1. 点击刚创建的服务
2. 进入 **Settings** 标签页
3. 在顶部的服务名称处，改为 `API`（这个名称会影响内网域名）

### 3.3 配置构建设置

由于这是 monorepo（一个仓库包含多个应用），需要告诉 Railway 只构建 API 部分：

1. 在 **Settings** 标签页中：
   - 找到 **Root Directory** → 留空（不要填！整个仓库都需要）
   - 找到 **Build Command** → 填写：
     ```
     pnpm --filter @energy-audit/api build
     ```
   - 找到 **Start Command** → 填写：
     ```
     pnpm --filter @energy-audit/api start
     ```

> **为什么不填 Root Directory？** 因为这是 pnpm monorepo，API 依赖 packages/ 下的共享包，需要完整仓库才能正确安装依赖和构建。

### 3.4 配置环境变量

1. 点击 **Variables** 标签页
2. 逐一添加以下变量：

| 变量名 | 值 | 如何添加 |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | 点击 **Add Reference** → 选择 PostgreSQL 服务 → 选择 `DATABASE_URL` |
| `API_PORT` | `3001` | 手动输入 |
| `NODE_ENV` | `production` | 手动输入 |
| `JWT_SECRET` | （自己生成一个随机字符串） | 手动输入，见下方说明 |
| `JWT_REFRESH_SECRET` | （自己生成一个随机字符串） | 手动输入，见下方说明 |

> **如何添加 DATABASE_URL（引用方式）**：
> 1. 点击 **+ New Variable**
> 2. 在变量名输入 `DATABASE_URL`
> 3. 在值的输入框中，点击右侧的 **Add Reference**（或直接输入 `${{Postgres.DATABASE_URL}}`）
> 4. 从下拉菜单中选择你的 PostgreSQL 服务
> 5. 选择 `DATABASE_URL` 变量
> 6. Railway 会自动填入引用语法

> **如何生成 JWT_SECRET 和 JWT_REFRESH_SECRET**：
> 这两个是用于用户登录认证的密钥，需要设置为随机的长字符串。你可以：
> - 方法 1：在浏览器控制台（F12）运行 `crypto.randomUUID()` 复制结果
> - 方法 2：用在线密码生成器生成 32+ 位随机字符串
> - 方法 3：随便打一串复杂字符（如 `my-energy-audit-jwt-secret-2026-xyz123`）
>
> **两个密钥必须不同！** JWT_SECRET 用于访问令牌，JWT_REFRESH_SECRET 用于刷新令牌。

> **重要**：**不要** 手动添加 `PORT` 变量！Railway 会自动注入 `PORT`，手动设置会导致冲突。API 代码使用 `API_PORT` 来确定监听端口。

### 3.5 配置网络

1. 进入 **Settings** 标签页
2. 找到 **Networking** 部分
3. **Public Networking**：点击 **Generate Domain** — 生成一个公网域名（用于直接测试 API，可选但推荐）
4. **Private Networking**：确保已启用 — 记下显示的内网域名（格式类似 `api.railway.internal`）

> **Private Domain 非常重要！** Web 服务需要通过这个地址访问 API。请复制保存，下一步会用到。

---

## 第四步：创建 Web 服务

### 4.1 创建服务并连接 GitHub

1. 在项目画布中，再次点击 **+ Create** → **GitHub Repo**
2. 选择同一个仓库 `Shenqiasd/EnergyAudit`
3. Railway 会创建第二个服务

### 4.2 重命名服务

1. 点击新服务 → **Settings** → 改名为 `Web`

### 4.3 配置构建设置

1. 在 **Settings** 标签页中：
   - **Root Directory** → 留空
   - **Build Command** → 填写：
     ```
     pnpm --filter @energy-audit/web build
     ```
   - **Start Command** → 填写：
     ```
     pnpm --filter @energy-audit/web start
     ```

### 4.4 配置环境变量

1. 点击 **Variables** 标签页
2. 添加以下变量：

| 变量名 | 值 | 说明 |
|---|---|---|
| `INTERNAL_API_URL` | `http://API的内网域名:3001` | 替换为上一步记录的 API Private Domain |
| `NODE_ENV` | `production` | 手动输入 |

**INTERNAL_API_URL 的值怎么填：**
- 如果 API 的 Private Domain 是 `api.railway.internal`，则填：`http://api.railway.internal:3001`
- 如果 Private Domain 是 `api-production-xxxx.railway.internal`，则填：`http://api-production-xxxx.railway.internal:3001`
- **注意**：是 `http://` 不是 `https://`，内网通信不需要 HTTPS
- **注意**：端口必须是 `3001`（API 监听的端口）

> **重要**：`INTERNAL_API_URL` 是**构建时变量** — Next.js 在构建时将这个地址写入编译产物。如果后续修改了这个值，需要手动触发 Web 服务重新部署（Redeploy），仅重启不会生效。

> **重要**：**不要** 手动添加 `PORT` 变量！Railway 会自动注入，手动设置会冲突。

### 4.5 配置网络

1. 进入 **Settings** 标签页
2. 找到 **Networking** → **Public Networking**
3. 点击 **Generate Domain** — 生成的公网域名就是**用户访问前端的地址**

> 这个域名就是你分享给用户使用的 URL，类似 `web-production-xxxx.up.railway.app`

---

## 第五步：配置服务间网络

确认以下连接关系已正确建立：

```
Web 服务 → (INTERNAL_API_URL) → API 服务 → (DATABASE_URL) → PostgreSQL
```

### 检查清单

- [ ] API 服务的 `DATABASE_URL` 引用了 PostgreSQL 服务（值显示为 `${{Postgres.DATABASE_URL}}`）
- [ ] API 服务的 `API_PORT` 设置为 `3001`
- [ ] API 服务的 `JWT_SECRET` 和 `JWT_REFRESH_SECRET` 已设置（两个不同的随机字符串）
- [ ] Web 服务的 `INTERNAL_API_URL` 指向 API 的 Private Domain + 端口 3001
- [ ] Web 服务有 Public Domain（公网域名）
- [ ] API 服务有 Private Domain（内网域名）
- [ ] **没有** 手动设置任何服务的 `PORT` 变量

---

## 第六步：触发部署

配置完成后，Railway 会自动开始部署。如果没有自动部署：

1. 点击任意服务
2. 进入 **Deployments** 标签页
3. 点击最新部署旁边的 **Redeploy** 按钮

> **部署顺序很重要**：确保 API 服务先部署成功后，再部署（或重新部署）Web 服务。因为 Web 构建时需要 API 的内网地址已经可用。

### 查看部署日志

1. 点击服务 → **Deployments** 标签页
2. 点击最新的 deployment
3. 可以看到 **Build Logs**（构建日志）和 **Deploy Logs**（运行日志）

**API 服务部署成功的标志**：
```
[Nest] XX  - XX/XX/XXXX  LOG [NestFactory] Starting Nest application...
[Nest] XX  - XX/XX/XXXX  LOG [RoutesResolver] HealthController {/api/v1/health}
...
Application is running on: http://localhost:3001/api/v1
```

**Web 服务部署成功的标志**：
```
▲ Next.js 16.2.1
- Local:         http://localhost:XXXX
- Network:       http://0.0.0.0:XXXX
✓ Ready in XXms
```

---

## 第七步：验证部署

### 7.1 验证 API

在浏览器中访问 API 的公网域名（如果你在第三步生成了 Public Domain）：

```
https://你的API域名.up.railway.app/api/v1/health
```

应该返回类似：
```json
{"status":"ok","timestamp":"...","uptime":...}
```

### 7.2 验证数据库连接

```
https://你的API域名.up.railway.app/api/v1/health/db
```

应该返回包含 `"database": "connected"` 的响应。

### 7.3 验证前端

在浏览器中访问 Web 的公网域名：

```
https://你的Web域名.up.railway.app
```

应该看到能源审计平台的角色选择页面（企业端 / 管理端 / 审核端）。

---

## 环境变量完整清单

### API 服务

| 变量名 | 必填 | 值 | 说明 |
|---|---|---|---|
| `DATABASE_URL` | **是** | `${{Postgres.DATABASE_URL}}` | 数据库连接字符串（引用 PostgreSQL 服务） |
| `API_PORT` | **是** | `3001` | API 监听端口 |
| `NODE_ENV` | **是** | `production` | 运行环境 |
| `JWT_SECRET` | **是** | 随机字符串（32+位） | 访问令牌签名密钥 |
| `JWT_REFRESH_SECRET` | **是** | 随机字符串（32+位） | 刷新令牌签名密钥（与 JWT_SECRET 不同） |

> **不要设置** `PORT` — Railway 自动注入。

### Web 服务

| 变量名 | 必填 | 值 | 说明 |
|---|---|---|---|
| `INTERNAL_API_URL` | **是** | `http://API内网域名:3001` | API 的内网地址（构建时变量） |
| `NODE_ENV` | **是** | `production` | 运行环境 |

> **不要设置** `PORT` — Railway 自动注入。

### PostgreSQL 服务

不需要手动配置任何变量，Railway 自动管理。

---

## 常见问题排查

### 问题 1：API 报错 `DATABASE_URL environment variable is not set`

**原因**：API 服务的 Variables 中没有正确配置 DATABASE_URL。

**解决**：
1. 进入 API 服务 → Variables
2. 删除已有的 DATABASE_URL（如果有）
3. 重新添加：点击 **+ New Variable** → 输入 `DATABASE_URL` → 点击 **Add Reference** → 选择 PostgreSQL → 选择 `DATABASE_URL`
4. 保存后 Railway 会自动重新部署

### 问题 2：Web 显示 502 Bad Gateway

**可能原因 1**：手动设置了 `PORT` 或 `HOSTNAME` 变量。

确认 Web 服务的 Variables 中**没有**手动设置 `PORT` 或 `HOSTNAME`。代码中已内置 `HOSTNAME=0.0.0.0`（确保绑定到所有网络接口），Railway 会自动注入 `PORT`。

**可能原因 2**：构建失败但部署继续了。

查看 Web 服务的 **Build Logs**，确认构建成功完成。

**可能原因 3**：Start Command 不正确。

确认 Start Command 设置为 `pnpm --filter @energy-audit/web start`。

### 问题 3：Web 页面打开了但 API 请求失败

**原因**：`INTERNAL_API_URL` 配置错误，或 API 服务未启动。

**解决**：
1. 先确认 API 服务已成功运行（查看 Deploy Logs）
2. 检查 API 服务的 Private Domain 是否与 Web 的 `INTERNAL_API_URL` 一致
3. 确认 `INTERNAL_API_URL` 格式为 `http://xxx.railway.internal:3001`（注意 http 不是 https）
4. 修改后需要**重新部署** Web 服务（Redeploy），因为这是构建时变量

### 问题 4：API 构建失败，报 `Cannot find module '@energy-audit/integrations'`

**原因**：Build Command 配置错误。

**解决**：确认 Build Command 为 `pnpm --filter @energy-audit/api build`。API 的 build 脚本会自动先编译依赖的 integrations 包。

### 问题 5：部署后页面空白或样式丢失

**原因**：Next.js standalone 模式需要正确的静态文件。

**解决**：确认 Web 服务的 Build Logs 中 `next build` 成功完成，输出类似 `○ (Static)  prerendered as static content`。

### 问题 6：登录功能不工作

**原因**：JWT_SECRET 未配置。

**解决**：确认 API 服务的 Variables 中设置了 `JWT_SECRET` 和 `JWT_REFRESH_SECRET`（两个不同的随机字符串）。

### 问题 7：Railway 提示 `Application failed to respond`

**原因**：应用没有在 Railway 预期的端口上监听。

**解决**：
- 确保**没有**手动设置 `PORT` 变量（让 Railway 自动注入）
- API 代码通过 `API_PORT` 配置端口，这个可以安全设置为 `3001`
- Web 代码已内置 `HOSTNAME=0.0.0.0`

---

## 日常维护

### 自动部署

连接 GitHub 仓库后，每次推送到 `main` 分支，Railway 会自动重新部署所有关联的服务。

### 手动重新部署

如果需要手动触发重新部署（比如修改了环境变量后）：
1. 点击服务 → **Deployments**
2. 点击最新部署旁的 **⋮** 菜单 → **Redeploy**

### 查看日志

1. 点击服务 → **Deployments** → 点击最新部署
2. **Build Logs**：构建过程的日志
3. **Deploy Logs**：应用运行时的日志

### 数据库管理

Railway 的 PostgreSQL 服务提供：
- 自动备份
- 连接信息自动管理
- 可以在 PostgreSQL 服务的 **Data** 标签页中直接查看数据

### 监控

Railway Dashboard 提供基础的资源监控：
- CPU 使用率
- 内存使用
- 网络流量

在服务的 **Metrics** 标签页中查看。

---

## 快速参考卡

部署完成后，你的服务地址：

| 服务 | 地址 |
|---|---|
| 前端（用户访问） | `https://你的Web域名.up.railway.app` |
| API（调试用） | `https://你的API域名.up.railway.app/api/v1/health` |
| 数据库 | 仅内网访问，通过 API 服务连接 |

**遇到问题时的排查顺序**：
1. 查看服务的 **Deploy Logs** — 看是否有错误信息
2. 查看服务的 **Build Logs** — 看构建是否成功
3. 检查 **Variables** — 确认环境变量正确
4. 检查 **Networking** — 确认域名已生成

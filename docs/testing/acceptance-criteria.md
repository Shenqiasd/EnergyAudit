# 验收标准

> 本文档定义能源审计平台的交付验收标准，涵盖功能完整性、性能基准、数据一致性、安全性、可用性和测试覆盖等维度。

---

## 一、功能完整性

### 1.1 任务实现状态

| 编号 | 任务名称 | 状态 |
|------|----------|------|
| Task 1 | 技术架构锁定与仓库布局 | 已完成 |
| Task 2 | 平台核心骨架初始化 | 已完成 |
| Task 3 | 核心领域模型与数据库 Schema | 已完成 |
| Task 4 | 企业管理与外部绑定 | 已完成 |
| Task 5 | 审计批次与项目生命周期 | 已完成 |
| Task 6 | 主数据与配置中心 | 已完成 |
| Task 7 | 24模块数据采集框架 | 已完成 |
| Task 8 | 计算引擎、图表与报告生成 | 已完成 |
| Task 9 | 审核与整改工作流 | 已完成 |
| Task 10 | 集成、异步任务与审计日志 | 已完成 |
| Task 11 | 端到端验证与交付文档 | 已完成 |
| Task 12 | 统计分析与决策支持看板 | 已完成 |
| Task 13 | 平台合并策略（业务类型分化） | 已完成 |

### 1.2 状态机验证

| 状态机 | 状态数 | 验收标准 |
|--------|--------|----------|
| 企业准入 | 6 | pending_review → approved / rejected / suspended / locked / expired 全部可达 |
| 审计项目 | 12 | pending_start → ... → closed 全链路流转，前置条件校验有效 |
| 填报记录 | 7 | draft → saved → submitted → returned → archived 正向/退回均正常 |
| 报告 | 8 | not_generated → draft_generated → ... → archived / voided 全覆盖 |
| 审核任务 | 7 | pending_assignment → ... → completed / closed 全覆盖 |
| 整改任务 | 7 | pending_issue → ... → completed / delayed / closed 全覆盖 |

### 1.3 核心功能清单

- [ ] 三端角色模型（enterprise_user / manager / reviewer）
- [ ] 24个填报模块框架
- [ ] 5层校验规则引擎
- [ ] 综合能耗（TCE）计算
- [ ] 碳排放计算
- [ ] 报告自动生成与版本管理
- [ ] 5类别结构化评分
- [ ] 4级严重程度问题登记
- [ ] 整改闭环跟踪
- [ ] 统计分析（批次/行业/碳排放）
- [ ] 三类台账（企业/审核/整改）
- [ ] CSV/Excel 导出
- [ ] 业务类型分化（能源审计/节能诊断）

---

## 二、性能基准

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 报告生成耗时 | < 30 秒 | 从触发异步任务到报告文件生成完成 |
| 页面首次加载 | < 2 秒 | 浏览器首次加载核心页面（列表页、详情页） |
| API 响应时间（单条CRUD） | < 500 毫秒 | GET/POST/PUT 单条记录操作 |
| API 响应时间（列表查询） | < 1 秒 | 分页列表查询（100条以内） |
| 计算引擎执行 | < 10 秒 | 单个项目综合能耗+碳排放计算 |
| 数据导入处理 | < 60 秒 | 100行 Excel 数据导入 |
| CSV 导出 | < 10 秒 | 1000行台账数据导出 |

---

## 三、数据一致性

### 3.1 数据库约束

- [ ] 所有外键约束完整且有效
- [ ] 唯一约束覆盖业务键（企业信用代码、项目唯一键等）
- [ ] 非空约束覆盖必填字段
- [ ] 索引覆盖高频查询字段

### 3.2 状态转换一致性

- [ ] 所有状态转换均通过状态机校验，不允许非法跳转
- [ ] 状态转换记录完整（project_status_transitions 表）
- [ ] 乐观锁机制有效防止并发冲突
- [ ] 协同编辑锁30分钟超时自动释放

### 3.3 数据完整性

- [ ] 项目创建时企业信息快照正确保存
- [ ] 计算快照包含完整的规则版本和参数记录
- [ ] 报告版本历史完整可追溯
- [ ] 删除操作级联正确（cascade / set null）

---

## 四、安全性

### 4.1 角色权限

- [ ] 三端角色隔离（企业端/管理端/审核端）
- [ ] 企业用户只能访问本企业数据
- [ ] 审核员只能访问分配给自己的审核任务
- [ ] 管理员可访问全部数据

### 4.2 审计日志

- [ ] 关键操作（登录、数据提交、审核、审批）均有日志记录
- [ ] 日志包含用户ID、角色、操作类型、目标对象、IP地址
- [ ] 日志不可篡改

### 4.3 数据安全

- [ ] 无明文密码存储
- [ ] 无硬编码凭据
- [ ] 环境变量管理敏感配置
- [ ] 附件存储路径不可直接访问

---

## 五、可用性

### 5.1 界面要求

- [ ] 三端独立布局（企业端/管理端/审核端）
- [ ] 响应式设计（桌面端优先）
- [ ] 统一的错误提示和加载状态
- [ ] 表单校验即时反馈
- [ ] 操作确认弹窗（危险操作）

### 5.2 用户体验

- [ ] 导航结构清晰，三级以内可达目标页面
- [ ] 列表页支持分页、筛选、排序
- [ ] 状态标签颜色区分
- [ ] 操作按钮根据当前状态动态显示/隐藏

---

## 六、测试覆盖

### 6.1 单元测试

- [ ] 所有后端服务模块均有对应测试文件
- [ ] 测试总数 ≥ 240
- [ ] 所有测试通过（`pnpm test`）
- [ ] 类型检查通过（`pnpm type-check`）

### 6.2 测试覆盖模块

| 测试文件 | 覆盖范围 |
|----------|----------|
| platform-smoke.test.ts | 平台核心骨架 |
| core-entities.test.ts | 领域模型实体 |
| admission-workflow.test.ts | 企业准入流程 |
| external-binding.test.ts | 外部系统绑定 |
| project-status-machine.test.ts | 项目状态机 |
| project-lifecycle.test.ts | 项目生命周期 |
| master-data-validation.test.ts | 主数据校验 |
| config-completeness.test.ts | 配置完整性 |
| carbon-emission-factor.test.ts | 碳排放因子 |
| data-record-submit.test.ts | 数据提交流程 |
| validation-execution.test.ts | 校验规则执行 |
| data-lock.test.ts | 协同编辑锁 |
| calculation-snapshot.test.ts | 计算快照 |
| carbon-calculation.test.ts | 碳排放计算 |
| report-draft-generation.test.ts | 报告生成 |
| review-workflow.test.ts | 审核工作流 |
| review-to-rectification.test.ts | 审核到整改 |
| enterprise-sync-retry.test.ts | 同步重试 |
| async-job-execution.test.ts | 异步任务 |
| batch-statistics.test.ts | 批次统计 |
| carbon-statistics.test.ts | 碳排放统计 |
| enterprise-ledger.test.ts | 企业台账 |
| business-type-routing.test.ts | 业务类型路由 |
| health.test.ts | 健康检查 |

---

## 七、交付物检查

- [ ] 源代码（全部13个任务）
- [ ] 数据库迁移文件（001-009，共9个）
- [ ] 测试套件（24个测试文件）
- [ ] 文档（设计、实施、测试、部署）
- [ ] 示例数据种子脚本
- [ ] 部署指南
- [ ] 交付摘要报告

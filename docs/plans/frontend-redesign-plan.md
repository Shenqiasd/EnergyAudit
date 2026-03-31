# 前端 UI 重构方案 — 对标 SaaS 级设计品质

> **文档版本**: v1.0  
> **创建日期**: 2026-03-31  
> **目标参考**: Navattic Product Demo Center (app.navattic.com)  
> **适用范围**: `apps/web` 全部前端页面

---

## 一、现状诊断

### 1.1 当前技术栈

| 层面 | 技术 | 版本 |
|---|---|---|
| 框架 | Next.js (App Router) + React | 16.2 / 19.2 |
| 样式 | Tailwind CSS v4 | 4.2 |
| 状态管理 | TanStack React Query + Zustand | 5.95 / 5.0 |
| 图标 | Lucide React | — |
| 字体 | Inter (Google Fonts) | — |
| 组件库 | 手写基础组件 (8 个) | — |

### 1.2 核心问题

| 问题分类 | 具体表现 |
|---|---|
| **组件体系薄弱** | 仅 8 个手写基础组件（Button / Card / Table / Badge / Modal / Input / Select / Loading），缺少 Dropdown、Toast、Skeleton、Tabs、Tooltip、Avatar、Progress、Command 等常用组件 |
| **样式系统简陋** | 纯 CSS 变量（hex 值）+ Tailwind，无主题层级、无暗色模式支持 |
| **布局视觉扁平** | 深色侧边栏 (`#1e293b`) + 白色 header + 灰色主区域，缺少层次感 |
| **交互动效缺失** | 几乎没有动画效果（仅 sidebar 收起有 transition），无页面转场 |
| **加载体验差** | 无骨架屏、无加载占位，数据获取期间白屏 |
| **空状态未处理** | 列表空数据时无引导性插画和文案 |
| **图表样式朴素** | 自写 SVG 图表，无交互和动画 |
| **移动端体验弱** | Sidebar 移动端为 slide-out，缺少底部 Tab 导航 |

### 1.3 现有组件清单

```
apps/web/src/components/
├── charts/               # SVG 自写图表（饼图/柱图/Sankey）
├── dashboard/            # KPI 卡片 / 进度板 / 预警列表 / 时间线
├── data-entry/           # 例外提交 / 导入回滚对话框
├── layout/               # AppShell + Sidebar + Header
├── notification/         # 通知铃铛 / 面板 / 列表
└── ui/                   # 8 个基础组件
    ├── badge.tsx
    ├── button.tsx         # 4 variant (primary/secondary/danger/ghost)
    ├── card.tsx           # 白色圆角卡片 + shadow-sm
    ├── input.tsx
    ├── loading.tsx
    ├── modal.tsx          # 简单居中弹窗
    ├── select.tsx
    └── table.tsx          # 基础表格
```

---

## 二、目标设计风格

### 2.1 设计原则

参考 Navattic 产品界面风格和现代 SaaS B2B 应用最佳实践：

1. **干净简洁** — 白色基底 + 微妙的灰色层次，信息密度适中
2. **色彩克制** — 品牌主色仅用于关键交互元素，辅以中性灰层次，状态色（绿/橙/红）仅点缀
3. **圆润柔和** — 卡片使用 `rounded-xl` + 柔和阴影，悬停有阴影升级效果
4. **留白充分** — 清晰的视觉层级：标题 → 副标题 → 正文 → 辅助文本
5. **微交互丰富** — 卡片悬停上浮、按钮 scale、列表项滑入动画
6. **一致性** — 图标风格统一（Lucide）、间距统一（4px 基线网格）、圆角统一

### 2.2 色板规范

```
主色（品牌蓝）
  50: #eff6ff    100: #dbeafe   200: #bfdbfe   300: #93c5fd
  400: #60a5fa   500: #3b82f6   600: #2563eb   700: #1d4ed8
  800: #1e40af   900: #1e3a8a   950: #172554

中性色（Slate）
  50: #f8fafc    100: #f1f5f9   200: #e2e8f0   300: #cbd5e1
  400: #94a3b8   500: #64748b   600: #475569   700: #334155
  800: #1e293b   900: #0f172a   950: #020617

语义色
  Success:  #16a34a (green-600)   Background: #dcfce7
  Warning:  #ea580c (orange-600)  Background: #ffedd5
  Danger:   #dc2626 (red-600)     Background: #fee2e2
  Info:     #0891b2 (cyan-600)    Background: #cffafe
```

### 2.3 排版规范

| 用途 | 字号 | 字重 | 颜色 |
|---|---|---|---|
| 页面标题 | 24px (`text-2xl`) | Bold (700) | Slate 900 |
| 卡片标题 | 18px (`text-lg`) | Semibold (600) | Slate 900 |
| 正文 | 14px (`text-sm`) | Regular (400) | Slate 700 |
| 辅助文本 | 12px (`text-xs`) | Regular (400) | Slate 400 |
| 数据数字 | 30px (`text-3xl`) | Bold (700) | Slate 900 |
| 标签/Badge | 12px (`text-xs`) | Medium (500) | 对应语义色 |

---

## 三、改造计划

### 阶段 1：设计基础设施升级 (P0)

**目标**：建立统一的设计 token 体系和组件基础。

#### 1.1 引入 shadcn/ui

```bash
# 安装 Radix 基础依赖
pnpm --filter @energy-audit/web add @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-avatar \
  @radix-ui/react-progress @radix-ui/react-select @radix-ui/react-popover \
  @radix-ui/react-toast @radix-ui/react-switch

# 安装工具库
pnpm --filter @energy-audit/web add tailwind-merge class-variance-authority
```

#### 1.2 创建 `cn()` 工具函数

```typescript
// apps/web/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### 1.3 主题 Token 系统

将 `globals.css` 中的 hex 变量改为 HSL token 体系，支持 Light/Dark 双主题：

```css
/* globals.css */
@import "tailwindcss";

:root {
  /* 品牌色 */
  --primary: 217 91% 60%;         /* #3b82f6 */
  --primary-foreground: 0 0% 100%;

  /* 背景 */
  --background: 210 40% 98%;      /* #f8fafc */
  --foreground: 222 47% 11%;      /* #0f172a */

  /* 卡片 */
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;

  /* 边框 */
  --border: 214 32% 91%;          /* #e2e8f0 */
  --ring: 217 91% 60%;

  /* 侧边栏 */
  --sidebar: 0 0% 100%;
  --sidebar-foreground: 215 25% 27%;
  --sidebar-border: 214 32% 91%;
  --sidebar-accent: 217 91% 97%;
  --sidebar-accent-foreground: 217 91% 50%;

  /* Muted */
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;

  /* 语义色 */
  --success: 142 71% 45%;
  --warning: 21 90% 48%;
  --danger: 0 72% 51%;

  /* 圆角 */
  --radius: 0.75rem;
}

.dark {
  --background: 222 47% 5%;
  --foreground: 210 40% 98%;
  --card: 222 47% 8%;
  --card-foreground: 210 40% 98%;
  --border: 217 33% 17%;
  --sidebar: 222 47% 7%;
  --sidebar-foreground: 215 20% 65%;
  --sidebar-border: 217 33% 17%;
  --sidebar-accent: 217 33% 14%;
  --sidebar-accent-foreground: 217 91% 70%;
  --muted: 217 33% 14%;
  --muted-foreground: 215 20% 55%;
  --ring: 217 91% 60%;
  --primary: 217 91% 60%;
  --primary-foreground: 0 0% 100%;
  --success: 142 71% 45%;
  --warning: 21 90% 48%;
  --danger: 0 72% 51%;
}
```

#### 1.4 动画基础

```bash
pnpm --filter @energy-audit/web add framer-motion
```

#### 1.5 图表升级

```bash
pnpm --filter @energy-audit/web add recharts
```

---

### 阶段 2：布局框架重构 (P0)

**目标**：重构整体布局骨架，从「功能可用」升级为「视觉精致」。

#### 2.1 新布局结构

```
┌─────────────────────────────────────────────────────────────────┐
│                        整体布局 (flex)                          │
├───────────────┬─────────────────────────────────────────────────┤
│               │  Header                                        │
│   Sidebar     │  ┌──────────────────────────────────────────┐  │
│   (浅色)      │  │  Breadcrumb    🔍全局搜索   🔔  👤 头像  │  │
│               │  └──────────────────────────────────────────┘  │
│  ┌─────────┐  │                                                │
│  │ Logo    │  │  Page Header                                   │
│  │─────────│  │  ┌──────────────────────────────────────────┐  │
│  │ 导航组1  │  │  │ 📄 页面标题          [+ 新建] [筛选 ▾]  │  │
│  │  · 项目1 │  │  │ 页面描述文字                             │  │
│  │  · 项目2 │  │  └──────────────────────────────────────────┘  │
│  │─────────│  │                                                │
│  │ 导航组2  │  │  Content Area (scroll)                        │
│  │  · 项目3 │  │  ┌──────────────────────────────────────────┐  │
│  │  · 项目4 │  │  │                                          │  │
│  │─────────│  │  │  KPI Cards / 表格 / 表单 / 图表           │  │
│  │         │  │  │                                          │  │
│  │ 底部     │  │  └──────────────────────────────────────────┘  │
│  │ 用户信息 │  │                                                │
│  └─────────┘  │                                                │
├───────────────┴─────────────────────────────────────────────────┤
│  (移动端) Bottom Tab Navigation                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.2 Sidebar 改造

**现状**：深色背景 (`bg-[#1e293b]`)，白色文字，功能性可用但视觉厚重。

**目标**：浅色/毛玻璃效果，精致分组导航。

| 属性 | 现状 | 改造后 |
|---|---|---|
| 背景色 | `#1e293b` (深色) | `白色 / backdrop-blur-xl` (毛玻璃) |
| 文字色 | `白色 / white/70` | `Slate 700 / Slate 400` |
| 宽度 | `w-60` / `w-16` | `w-64` / `w-16`，过渡动画优化 |
| 活跃项 | `bg-[#0f172a]` 背景 | `bg-primary/8` + 左侧 `3px` 蓝色指示条 |
| 分组标题 | 纯文字 uppercase | 小圆点 + 文字 + 折叠动画 |
| 底部区域 | 无 | 用户头像 + 姓名 + 角色标签 + 退出按钮 |
| 品牌区 | `FileBarChart` 图标 | Logo 图标 + 品牌名 + 角色标签 |

**Sidebar 代码结构变更**:

```tsx
<aside className="flex h-full flex-col border-r border-[hsl(var(--sidebar-border))]
  bg-[hsl(var(--sidebar))] backdrop-blur-xl transition-all duration-300">

  {/* 品牌区域 */}
  <div className="flex h-16 items-center gap-3 px-4">
    <Logo />
    {!collapsed && <span className="font-semibold">能源审计平台</span>}
  </div>

  {/* 导航区域 */}
  <nav className="flex-1 overflow-y-auto px-3 py-4">
    {groups.map(group => (
      <div key={group.label} className="mb-4">
        <GroupHeader />
        <AnimatePresence>
          {expanded && group.items.map(item => (
            <NavItem key={item.href} active={isActive}>
              {/* 左侧蓝色指示条 */}
              {isActive && <motion.div className="absolute left-0 w-[3px] h-6
                rounded-r-full bg-[hsl(var(--primary))]" layoutId="activeIndicator" />}
              <Icon /><Label />
            </NavItem>
          ))}
        </AnimatePresence>
      </div>
    ))}
  </nav>

  {/* 底部用户信息 */}
  <div className="border-t border-[hsl(var(--sidebar-border))] p-4">
    <Avatar /><UserName /><RoleBadge />
  </div>
</aside>
```

#### 2.3 Header 改造

| 属性 | 现状 | 改造后 |
|---|---|---|
| 边框 | `border-b` 底线 | 移除底线，改用 `shadow-xs` |
| 面包屑 | 文字拼接 | 带图标 + 可点击的链接式面包屑 |
| 搜索 | 无 | 增加全局搜索栏 (`Cmd+K` 快捷键) |
| 用户区 | 文字 + Badge | `Avatar` 头像 + `DropdownMenu` |
| 角色切换 | 手写 dropdown | 使用 Radix `DropdownMenu` 组件 |

#### 2.4 新增 Page Header 组件

统一所有页面的标题区域：

```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;  // 右侧操作按钮区
  breadcrumb?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
```

---

### 阶段 3：核心组件重写 (P1)

**目标**：用 shadcn/ui + Radix 替换或增强现有 8 个基础组件，新增 12+ 常用组件。

#### 3.1 现有组件升级

| 组件 | 改动要点 |
|---|---|
| **Button** | 从 4 variant 扩展为 6 variant（+ `outline` / `link`），增加 `loading` 状态（spinner 动画）、`icon` 模式（圆形按钮）。使用 `class-variance-authority` 管理变体 |
| **Card** | 增加 `hover:shadow-md hover:-translate-y-0.5` 悬停上浮效果，增加 `CardDescription` / `CardContent` / `CardFooter` 子组件 |
| **Table** | 增加表头排序图标、斑马纹 (`even:bg-muted/50`)、行选择 checkbox、空状态插画、分页组件 |
| **Modal** | 改用 Radix `Dialog`，增加进入/退出动画（scale + fade）、多尺寸（`sm` / `md` / `lg` / `full`）、`Sheet` 侧滑变体 |
| **Badge** | 扩展 variant（`default` / `secondary` / `outline` / `destructive`），增加动画脉冲效果（用于未读标记） |
| **Input** | 增加前置/后置图标插槽、错误状态红色边框、helper text |
| **Select** | 改用 Radix `Select`，增加搜索过滤、多选模式 |
| **Loading** | 改为 `Skeleton` 骨架屏 + `Spinner` 加载指示器双组件 |

#### 3.2 新增组件清单

| 组件 | 基于 | 用途 |
|---|---|---|
| `Avatar` | Radix Avatar | 用户头像，支持图片/文字回退/在线状态指示 |
| `Tabs` | Radix Tabs | 下划线式 / 按钮组式选项卡 |
| `Tooltip` | Radix Tooltip | 悬停提示 |
| `DropdownMenu` | Radix DropdownMenu | 下拉菜单（Header 用户菜单、表格行操作） |
| `Toast` | Radix Toast | 右下角通知弹窗（成功/失败/信息/警告） |
| `Progress` | Radix Progress | 进度条 + 环形进度 |
| `Popover` | Radix Popover | 弹出层（筛选面板等） |
| `Command` | cmdk | `Cmd+K` 全局搜索面板 |
| `Stepper` | 自写 | 步骤条（数据填报流程） |
| `EmptyState` | 自写 | 空数据状态（SVG 插画 + 引导文案 + CTA） |
| `Skeleton` | 自写 | 加载占位骨架屏 |
| `DataTable` | TanStack Table | 高级数据表格（排序/筛选/分页/行选择） |
| `Switch` | Radix Switch | 开关切换 |
| `StatCard` | 自写 | KPI 统计卡片（迷你图 + 数字动画） |

#### 3.3 KPI 卡片升级 (StatCard)

**现状**：白色扁平卡片，图标 + 数字 + 趋势箭头。

**目标**：微渐变背景 + 右侧迷你图 (sparkline) + 数字跳动动画。

```tsx
<StatCard
  icon={Building2}
  label="企业总数"
  value={1284}
  trend={{ direction: "up", value: "12%", text: "较上月" }}
  sparklineData={[30, 45, 28, 80, 99, 75, 120]}
  accentColor="blue"    // 决定渐变色和图标背景色
/>
```

渲染效果：
```
┌─────────────────────────────────────────┐
│  🏢   企业总数              📈 sparkline │
│       1,284                             │
│       ↑ 12% 较上月                      │
└─────────────────────────────────────────┘
  蓝色渐变左上角                  hover 上浮
```

---

### 阶段 4：页面级视觉升级 (P2 + P3)

#### 4.1 登录页 / 首页 (P2)

**现状**：居中 3 张角色选择卡片，简单文字描述。

**目标**：左右分栏布局 + 画廊式角色卡片。

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│   ┌────────────────────┐  ┌────────────────────────────┐  │
│   │                    │  │                            │  │
│   │   品牌面板          │  │    登录表单               │  │
│   │                    │  │    ┌──────────────────┐    │  │
│   │   ● 渐变背景       │  │    │ 邮箱             │    │  │
│   │   ● 产品截图       │  │    │ 密码             │    │  │
│   │   ● 3个特性亮点    │  │    │ [登录]           │    │  │
│   │   ● 客户Logo条     │  │    └──────────────────┘    │  │
│   │                    │  │                            │  │
│   │                    │  │    开发模式：              │  │
│   │                    │  │    ┌──────┬──────┬──────┐  │  │
│   │                    │  │    │企业端│管理端│审核端│  │  │
│   │                    │  │    └──────┴──────┴──────┘  │  │
│   │                    │  │                            │  │
│   └────────────────────┘  └────────────────────────────┘  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

#### 4.2 管理端 Dashboard (P2)

```
┌────────────────────────────────────────────────────────────┐
│  Page Header: 工作台                           [导出报告]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                      │
│  │ KPI1 │ │ KPI2 │ │ KPI3 │ │ KPI4 │   ← StatCard x4     │
│  │ 企业  │ │ 项目  │ │ 审核  │ │ 整改  │   带 sparkline     │
│  └──────┘ └──────┘ └──────┘ └──────┘                      │
│                                                            │
│  ┌──────────────────────┐ ┌──────────────────────┐         │
│  │   项目状态分布        │ │   月度趋势            │         │
│  │   (饼图/环形图)      │ │   (面积图)            │         │
│  └──────────────────────┘ └──────────────────────┘         │
│                                                            │
│  ┌──────────────────────┐ ┌──────────────────────┐         │
│  │   预警列表            │ │   最近活动            │         │
│  │   (红橙色卡片+倒计时) │ │   (头像+流式时间线)   │         │
│  └──────────────────────┘ └──────────────────────┘         │
│                                                            │
│  ┌────────────────────────────────────────────────┐        │
│  │   快捷操作                                     │        │
│  │   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │        │
│  │   │新建批次│ │企业准入│ │分派审核│ │统计导出│        │        │
│  │   └──────┘ └──────┘ └──────┘ └──────┘        │        │
│  └────────────────────────────────────────────────┘        │
└────────────────────────────────────────────────────────────┘
```

#### 4.3 列表页通用模式 (P2)

适用于：企业管理、项目管理、批次管理、审核管理等所有列表页。

```
┌────────────────────────────────────────────────────────────┐
│  Page Header: 企业管理                    [+ 新增企业]     │
│  管理所有已注册的审计企业                                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌ 筛选条 ──────────────────────────────────────────────┐  │
│  │ 🔍 搜索企业名称   [状态 ▾]  [行业 ▾]  [批次 ▾]  📊📋 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                              ↑ 视图切换     │
│  表格视图 ─────────────────────────────────────────────    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ☐  企业名称      行业    状态    负责人   操作        │  │
│  │────────────────────────────────────────────────────── │  │
│  │ ☐  某某能源集团   电力    ● 已审批  张三    ⋯         │  │
│  │ ☐  某某化工有限   化工    ● 待审核  李四    ⋯         │  │
│  │ ☐  ...                                               │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ 共 128 条   ← 1 2 3 ... 13 →    每页 [10 ▾] 条     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  卡片视图 (可切换) ────────────────────────────────────    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 企业卡片1 │ │ 企业卡片2 │ │ 企业卡片3 │ │ 企业卡片4 │    │
│  │ 名称+状态 │ │ 名称+状态 │ │ 名称+状态 │ │ 名称+状态 │    │
│  │ 行业+进度 │ │ 行业+进度 │ │ 行业+进度 │ │ 行业+进度 │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
└────────────────────────────────────────────────────────────┘
```

#### 4.4 详情页通用模式 (P3)

```
┌────────────────────────────────────────────────────────────┐
│  Breadcrumb: 项目管理 > 某某能源集团 2025年度审计            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌ 信息头卡片 ────────────────────────────────────────── ┐  │
│  │ 某某能源集团 2025年度审计          ● 数据采集中        │  │
│  │ 批次: 2025年度第一批 │ 创建: 2025-03-01 │ 负责: 张三  │  │
│  │                                    [操作 ▾]          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌ Tabs ───────────────────────────────────────────────┐   │
│  │ [基本信息]  [填报数据]  [审核记录]  [操作日志]        │   │
│  │─────────────────────────────────────────────────────│   │
│  │                                                     │   │
│  │ Tab 内容区域                                        │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

#### 4.5 数据填报页 (P3)

```
┌────────────────────────────────────────────────────────────┐
│  Page Header: 数据填报 — 某某能源集团                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌ Stepper ────────────────────────────────────────────┐   │
│  │ ● 基本信息  ─  ● 能源消费  ─  ○ 碳排放  ─  ○ 提交  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌ 表单分组卡片 1: 基本信息 ───────────────────  [▼ 折叠] ┐ │
│  │                                                       │ │
│  │  企业名称: [____________]    统一社会信用代码: [______] │ │
│  │  所属行业: [电力 ▾]          企业规模: [大型 ▾]        │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌ 表单分组卡片 2: 联系信息 ───────────────────  [▼ 折叠] ┐ │
│  │  ...                                                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌ 底部 Sticky 操作栏 ────────────────────────────────── ┐ │
│  │ 自动保存: 30秒前 ✓        [保存草稿]  [上一步]  [下一步] │ │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

### 阶段 5：精细化打磨 (P4)

| 项目 | 实现方式 | 优先级 |
|---|---|---|
| **暗色模式** | CSS 变量双套 + `class` 策略切换，Header 增加主题切换按钮 | 中 |
| **页面转场** | `framer-motion` `AnimatePresence` + `layout` animation | 中 |
| **空状态** | 每个列表页定制 SVG 插画 + 引导文案 + CTA 按钮 | 高 |
| **骨架屏** | 首屏数据加载时显示 Skeleton，避免白屏闪烁 | 高 |
| **响应式优化** | 移动端 Sidebar 全屏覆盖 + 底部 Tab 导航 | 中 |
| **操作反馈** | Toast 通知替代 `alert()`，所有 API 操作有成功/失败反馈 | 高 |
| **键盘快捷键** | `Cmd+K` 全局搜索、`Esc` 关闭弹窗 | 低 |
| **数字动画** | KPI 数字从 0 到目标值的计数动画 | 低 |
| **列表动画** | 列表项交错滑入 (`staggerChildren`) | 低 |

---

## 四、技术选型变更汇总

```diff
  当前                              →    改造后
  ──────────────────────────           ──────────────────────────
  手写 8 个基础 UI 组件               →  shadcn/ui (20+ Radix 组件)
  clsx 手动类名                       →  tailwind-merge + clsx (cn 工具)
  无动画                              →  framer-motion + CSS transition
  CSS 变量 (hex)                      →  HSL token 体系 (Light / Dark)
  无全局 UI 状态管理                   →  Zustand (sidebar / theme store)
  自写 SVG 图表                       →  recharts (与 shadcn chart 集成)
  无加载状态                          →  React Suspense + Skeleton
  无全局搜索                          →  cmdk (Command 面板)
  基础表格                            →  TanStack Table + DataTable 封装
  无操作反馈                          →  Radix Toast
```

### 新增依赖清单

```json
{
  "dependencies": {
    "@radix-ui/react-avatar": "^1.1",
    "@radix-ui/react-dialog": "^1.1",
    "@radix-ui/react-dropdown-menu": "^2.1",
    "@radix-ui/react-popover": "^1.1",
    "@radix-ui/react-progress": "^1.1",
    "@radix-ui/react-select": "^2.1",
    "@radix-ui/react-switch": "^1.1",
    "@radix-ui/react-tabs": "^1.1",
    "@radix-ui/react-toast": "^1.2",
    "@radix-ui/react-tooltip": "^1.1",
    "@tanstack/react-table": "^8.21",
    "class-variance-authority": "^0.7",
    "cmdk": "^1.0",
    "framer-motion": "^12.0",
    "recharts": "^2.15",
    "tailwind-merge": "^3.0"
  }
}
```

---

## 五、实施优先级 & 排期

| 优先级 | 阶段 | 核心产出 | 预估工作量 | 影响面 |
|---|---|---|---|---|
| 🔴 **P0** | 阶段 1 + 阶段 2 | 设计 token + cn() + 布局框架 + Sidebar/Header 重构 | 2-3 天 | 全局框架 |
| 🟠 **P1** | 阶段 3 | 20+ 组件库（升级 8 + 新增 12+） | 3-4 天 | 所有页面 |
| 🟡 **P2** | 阶段 4.1 - 4.3 | 登录页 + Dashboard + 列表页模板 | 4-5 天 | 主要页面 |
| 🟢 **P3** | 阶段 4.4 - 4.5 | 详情页 + 数据填报页 | 3-4 天 | 业务页面 |
| 🔵 **P4** | 阶段 5 | 暗色模式 + 动画 + 空状态 + 骨架屏 | 2-3 天 | 体验提升 |

**总计**: 约 14-19 个工作日

---

## 六、验收标准

### 设计质量
- [ ] 所有页面通过 4px 基线网格对齐检查
- [ ] 颜色使用严格遵循设计 token，无硬编码色值
- [ ] 所有交互元素有 `hover` / `focus` / `active` 状态反馈
- [ ] 页面在 1280px / 1024px / 768px / 375px 四个断点下布局正确

### 组件质量
- [ ] 所有组件支持 `className` 透传
- [ ] 所有表单组件支持受控/非受控两种模式
- [ ] 所有弹窗组件支持 `Esc` 关闭和点击遮罩关闭
- [ ] Button 组件的 loading 状态禁止重复点击

### 性能指标
- [ ] 首屏 LCP < 2.5s
- [ ] 页面切换无白屏闪烁（Skeleton 覆盖）
- [ ] 移动端触控响应无明显延迟

### 可访问性
- [ ] 所有交互元素可通过 Tab 键聚焦
- [ ] 图标按钮有 `aria-label`
- [ ] 颜色对比度符合 WCAG AA 标准（4.5:1）

---

## 七、风险与对策

| 风险 | 影响 | 对策 |
|---|---|---|
| shadcn/ui 引入可能与现有 Tailwind v4 配置冲突 | 组件样式异常 | 先在独立分支验证 Radix + Tailwind v4 兼容性 |
| 组件 API 变更影响大量页面 | 需要批量修改 | 保持现有组件 API 向后兼容，内部实现替换 |
| 自写 SVG 图表迁移到 recharts 工作量大 | 5 种图表需要重写 | 分阶段迁移，优先迁移 Dashboard 图表 |
| framer-motion 增加打包体积 | 首屏加载变慢 | 使用 `dynamic import` 懒加载动画组件 |
| 暗色模式需要所有页面适配 | 测试覆盖面大 | 放在 P4 最后实施，使用 CSS 变量自动适配 |

---

## 附录：参考资源

- [shadcn/ui 组件库](https://ui.shadcn.com/)
- [Radix UI 基础组件](https://www.radix-ui.com/)
- [Tailwind CSS v4 文档](https://tailwindcss.com/docs)
- [Recharts 图表库](https://recharts.org/)
- [Framer Motion 动画](https://motion.dev/)
- [cmdk 命令面板](https://cmdk.paco.me/)
- [Navattic 产品参考](https://www.navattic.com/)

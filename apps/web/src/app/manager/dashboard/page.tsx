"use client";

import {
  Building2,
  TrendingUp,
  ClipboardCheck,
  Wrench,
  AlertTriangle,
  Clock,
  Plus,
  FileText,
  Users,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/layout/page-header";
import {
  useDashboardSummary,
  useAlerts,
  useTimeline,
} from "@/lib/api/hooks/use-statistics";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Project status color mapping (12 statuses)
const statusColors: Record<string, string> = {
  pending_start: "#94a3b8",
  data_collecting: "#3b82f6",
  data_submitted: "#6366f1",
  calculating: "#8b5cf6",
  report_generating: "#a855f7",
  report_review: "#ec4899",
  review_in_progress: "#f59e0b",
  review_completed: "#10b981",
  rectification: "#ef4444",
  rectification_verified: "#06b6d4",
  completed: "#22c55e",
  closed: "#64748b",
};

const statusLabels: Record<string, string> = {
  pending_start: "待启动",
  data_collecting: "数据采集中",
  data_submitted: "数据已提交",
  calculating: "计算中",
  report_generating: "报告生成中",
  report_review: "报告审核",
  review_in_progress: "审核中",
  review_completed: "审核完成",
  rectification: "整改中",
  rectification_verified: "整改已验收",
  completed: "已完成",
  closed: "已关闭",
};

// Mock data for charts (will be replaced by API data when available)
const mockStatusDistribution = [
  { status: "pending_start", count: 5 },
  { status: "data_collecting", count: 12 },
  { status: "data_submitted", count: 8 },
  { status: "calculating", count: 3 },
  { status: "report_generating", count: 4 },
  { status: "report_review", count: 6 },
  { status: "review_in_progress", count: 7 },
  { status: "review_completed", count: 10 },
  { status: "rectification", count: 5 },
  { status: "rectification_verified", count: 3 },
  { status: "completed", count: 15 },
  { status: "closed", count: 8 },
];

const mockMonthlyTrend = [
  { month: "10月", projects: 12, reviews: 5, rectifications: 2 },
  { month: "11月", projects: 18, reviews: 8, rectifications: 4 },
  { month: "12月", projects: 25, reviews: 12, rectifications: 6 },
  { month: "1月", projects: 30, reviews: 15, rectifications: 8 },
  { month: "2月", projects: 28, reviews: 18, rectifications: 10 },
  { month: "3月", projects: 35, reviews: 22, rectifications: 12 },
];

const quickActions = [
  {
    icon: Plus,
    label: "创建批次",
    description: "新建审计批次",
    href: "/manager/batches",
  },
  {
    icon: Users,
    label: "企业管理",
    description: "管理企业准入",
    href: "/manager/enterprises",
  },
  {
    icon: FileText,
    label: "项目管理",
    description: "查看所有项目",
    href: "/manager/projects",
  },
  {
    icon: BarChart3,
    label: "统计分析",
    description: "查看统计报表",
    href: "/manager/statistics",
  },
];

const alertTypeIcons: Record<string, { color: string; borderColor: string }> = {
  overdue_project: { color: "text-red-500", borderColor: "border-l-red-500" },
  delayed_rectification: { color: "text-red-500", borderColor: "border-l-red-500" },
  approaching_deadline: { color: "text-orange-500", borderColor: "border-l-orange-500" },
  low_score: { color: "text-orange-500", borderColor: "border-l-orange-500" },
  overdue_batch: { color: "text-red-500", borderColor: "border-l-red-500" },
};

const roleLabels: Record<string, string> = {
  manager: "管理员",
  enterprise_user: "企业",
  reviewer: "审核员",
};

const roleColors: Record<string, string> = {
  manager: "bg-blue-100 text-blue-700",
  enterprise_user: "bg-green-100 text-green-700",
  reviewer: "bg-purple-100 text-purple-700",
};

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "刚刚";
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 7) return `${diffDay}天前`;
    return date.toLocaleDateString("zh-CN");
  } catch {
    return dateStr;
  }
}

function formatCountdown(dateStr: string): string {
  try {
    const deadline = new Date(dateStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `已超期 ${Math.abs(diffDays)} 天`;
    if (diffDays === 0) return "今日到期";
    return `剩余 ${diffDays} 天`;
  } catch {
    return "";
  }
}

export default function ManagerDashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const { data: timeline, isLoading: timelineLoading } = useTimeline();

  const isLoading = summaryLoading || alertsLoading || timelineLoading;

  if (isLoading) {
    return <Loading />;
  }

  const totalEnterprises = (summary?.activeBatches ?? 0) * 10;
  const activeProjects = Math.round(
    (summary?.activeBatches ?? 0) * 10 * (1 - (summary?.projectCompletionRate ?? 0)),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="工作台"
        description="管理端工作台 — 审计工作总览、项目进度、审核状态统计"
      />

      {/* KPI StatCards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          label="企业总数"
          value={totalEnterprises}
          accentColor="blue"
          trend={{ direction: "up", value: "+12%", text: "较上月" }}
          sparklineData={[20, 25, 30, 28, 35, 40, 45]}
        />
        <StatCard
          icon={TrendingUp}
          label="进行中项目"
          value={activeProjects}
          accentColor="green"
          trend={{ direction: "up", value: "+8%", text: "较上月" }}
          sparklineData={[10, 15, 12, 18, 20, 22, 25]}
        />
        <StatCard
          icon={ClipboardCheck}
          label="待审核任务"
          value={summary?.pendingReviewTasks ?? 0}
          accentColor="orange"
          trend={{ direction: "down", value: "-5%", text: "较上月" }}
          sparklineData={[15, 12, 18, 14, 10, 8, 6]}
        />
        <StatCard
          icon={Wrench}
          label="整改中任务"
          value={summary?.overdueAlerts ?? 0}
          accentColor="purple"
          trend={{ direction: "flat", value: "0%", text: "较上月" }}
          sparklineData={[5, 6, 4, 7, 5, 6, 5]}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart: Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>项目状态分布</CardTitle>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockStatusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="status"
                >
                  {mockStatusDistribution.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={statusColors[entry.status] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${value} 个`,
                    statusLabels[String(name)] ?? String(name),
                  ]}
                />
                <Legend
                  formatter={(value: string) => statusLabels[value] ?? value}
                  wrapperStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Area Chart: Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>月度趋势（近6个月）</CardTitle>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockMonthlyTrend}>
                <defs>
                  <linearGradient id="gradProjects" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradReviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRectifications" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="projects"
                  name="项目数"
                  stroke="#3b82f6"
                  fill="url(#gradProjects)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="reviews"
                  name="审核数"
                  stroke="#10b981"
                  fill="url(#gradReviews)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="rectifications"
                  name="整改数"
                  stroke="#f59e0b"
                  fill="url(#gradRectifications)"
                  strokeWidth={2}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Alert List + Activity Timeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alert List with colored left border */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" />
              预警列表
            </CardTitle>
            <Badge variant="danger">{(alerts ?? []).length}</Badge>
          </CardHeader>
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {(alerts ?? []).length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                暂无预警
              </div>
            ) : (
              (alerts ?? []).map((alert) => {
                const style = alertTypeIcons[alert.type] ?? {
                  color: "text-orange-500",
                  borderColor: "border-l-orange-500",
                };
                return (
                  <Link
                    key={alert.id}
                    href={
                      alert.relatedId
                        ? `/manager/projects?highlight=${alert.relatedId}`
                        : "#"
                    }
                    className={`flex items-start gap-3 rounded-lg border border-[hsl(var(--border))] border-l-4 ${style.borderColor} p-3 transition-colors hover:bg-[hsl(var(--muted))]/50`}
                  >
                    <AlertTriangle
                      size={16}
                      className={`mt-0.5 shrink-0 ${style.color}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                          {alert.title}
                        </span>
                        <span className="shrink-0 text-xs font-medium text-red-500">
                          {formatCountdown(alert.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                        {alert.description}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>

        {/* Activity Timeline with Avatar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              最近活动
            </CardTitle>
          </CardHeader>
          <div className="max-h-80 space-y-0 overflow-y-auto">
            {(timeline ?? []).length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                暂无活动记录
              </div>
            ) : (
              (timeline ?? []).map((item, index) => (
                <div key={item.id} className="flex gap-3">
                  {/* Vertical timeline */}
                  <div className="flex flex-col items-center">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={`text-xs ${roleColors[item.userRole] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {(roleLabels[item.userRole] ?? "用")[0]}
                      </AvatarFallback>
                    </Avatar>
                    {index < (timeline ?? []).length - 1 && (
                      <div className="w-px flex-1 bg-[hsl(var(--border))]" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {item.action}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {roleLabels[item.userRole] ?? item.userRole}
                      </Badge>
                    </div>
                    {item.detail && (
                      <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                        {item.detail}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">
          快捷操作
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className="group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/10">
                    <action.icon
                      size={24}
                      className="text-[hsl(var(--primary))]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        {action.label}
                      </span>
                      <ArrowRight
                        size={16}
                        className="text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-1"
                      />
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  Building2,
  TrendingUp,
  ClipboardCheck,
  AlertTriangle,
  Clock,
  Plus,
  FileText,
  Users,
  BarChart3,
  ArrowRight,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardSkeleton } from "@/components/skeleton/dashboard-skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  rectification_verified: "整改验收",
  completed: "已完成",
  closed: "已关闭",
};

// Mock data for charts
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
    label: "创建计划批次",
    description: "下达新一期审计任务",
    href: "/manager/batches",
  },
  {
    icon: Users,
    label: "企业名录管理",
    description: "维护重点用能单位库",
    href: "/manager/enterprises",
  },
  {
    icon: FileText,
    label: "审计项目追踪",
    description: "监控全局审计进度",
    href: "/manager/projects",
  },
  {
    icon: BarChart3,
    label: "能效数据分析",
    description: "查看区域双碳报表",
    href: "/manager/statistics",
  },
];

const alertTypeIcons: Record<string, { color: string; bg: string; border: string }> = {
  overdue_project: { color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-900" },
  delayed_rectification: { color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-900" },
  approaching_deadline: { color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-900" },
  low_score: { color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-900" },
  overdue_batch: { color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-900" },
};

const roleLabels: Record<string, string> = {
  manager: "监管",
  enterprise_user: "企业",
  reviewer: "专家",
};

const roleColors: Record<string, string> = {
  manager: "bg-blue-100 text-blue-700",
  enterprise_user: "bg-emerald-100 text-emerald-700",
  reviewer: "bg-indigo-100 text-indigo-700",
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


export default function ManagerDashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const { data: timeline, isLoading: timelineLoading } = useTimeline();

  const isLoading = summaryLoading || alertsLoading || timelineLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const totalEnterprises = (summary?.activeBatches ?? 0) * 10;
  const activeProjects = Math.round(
    (summary?.activeBatches ?? 0) * 10 * (1 - (summary?.projectCompletionRate ?? 0)),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="监管指挥大屏"
        description="纵览全市重点用能单位审计态势，监控异常指标与超期任务"
      />

      {/* KPI StatCards */}
      <motion.div
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }}
      >
        {[
          {
            icon: Building2, label: "监管企业库", value: totalEnterprises,
            accentColor: "blue" as const, trend: { direction: "up" as const, value: "+12%", text: "较上月增长" },
            sparklineData: [20, 25, 30, 28, 35, 40, 45],
          },
          {
            icon: Activity, label: "活跃项目", value: activeProjects,
            accentColor: "green" as const, trend: { direction: "up" as const, value: "+8%", text: "环比攀升" },
            sparklineData: [10, 15, 12, 18, 20, 22, 25],
          },
          {
            icon: ClipboardCheck, label: "待评审项", value: summary?.pendingReviewTasks ?? 0,
            accentColor: "purple" as const, trend: { direction: "down" as const, value: "-5%", text: "积压减轻" },
            sparklineData: [15, 12, 18, 14, 10, 8, 6],
          },
          {
            icon: AlertTriangle, label: "高危预警", value: summary?.overdueAlerts ?? 0,
            accentColor: "orange" as const, trend: { direction: "flat" as const, value: "0%", text: "态势平稳" },
            sparklineData: [5, 6, 4, 7, 5, 6, 5],
          },
        ].map((card) => (
          <motion.div
            key={card.label}
            variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}
          >
            <StatCard {...card} />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        <Card className="border-[hsl(var(--border))] shadow-sm">
          <CardHeader className="border-b border-[hsl(var(--border))] pb-4 mb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp size={18} className="text-[hsl(var(--primary))]" />
              审计业务走势 (近半年)
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                  />
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
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} iconType="circle" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Status Distribution */}
        <Card className="border-[hsl(var(--border))] shadow-sm">
          <CardHeader className="border-b border-[hsl(var(--border))] pb-4 mb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 size={18} className="text-[hsl(var(--primary))]" />
              全局状态透视
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockStatusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="status"
                    stroke="none"
                  >
                    {mockStatusDistribution.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={statusColors[entry.status] ?? "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                    formatter={(value, name) => [
                      `${value} 项`,
                      statusLabels[String(name)] ?? String(name),
                    ]}
                  />
                  <Legend
                    formatter={(value: string) => statusLabels[value] ?? value}
                    wrapperStyle={{ fontSize: "12px" }}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions - 1 col */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))] tracking-tight pl-1">
            指挥调度中心
          </h3>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} className="block">
                <Card className="group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md border-[hsl(var(--border))] hover:border-[hsl(var(--primary))/40]">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))/10] text-[hsl(var(--primary))] transition-colors group-hover:bg-[hsl(var(--primary))] group-hover:text-white">
                      <action.icon size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                          {action.label}
                        </span>
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Alert List - 1 col */}
        <Card className="border-[hsl(var(--border))] shadow-sm">
          <CardHeader className="border-b border-[hsl(var(--border))] pb-4 mb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" />
              风险预警
            </CardTitle>
            <Badge variant="danger">{(alerts ?? []).length} 项</Badge>
          </CardHeader>
          <CardContent className="p-0 px-4 pb-4">
            <div className="max-h-[340px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {(alerts ?? []).length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                  暂无风险告警，运行良好
                </div>
              ) : (
                (alerts ?? []).map((alert) => {
                  const style = alertTypeIcons[alert.type] ?? {
                    color: "text-orange-600",
                    bg: "bg-orange-50",
                    border: "border-orange-200"
                  };
                  return (
                    <Link
                      key={alert.id}
                      href={
                        alert.relatedId
                          ? `/manager/projects?highlight=${alert.relatedId}`
                          : "#"
                      }
                      className={`flex items-start gap-3 rounded-xl border ${style.border} ${style.bg} p-3 transition-colors hover:shadow-sm`}
                    >
                      <AlertTriangle
                        size={16}
                        className={`mt-0.5 shrink-0 ${style.color}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                            {alert.title}
                          </span>
                          <span className="shrink-0 text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
                            {formatRelativeTime(alert.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                          {alert.description}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline - 1 col */}
        <Card className="border-[hsl(var(--border))] shadow-sm">
          <CardHeader className="border-b border-[hsl(var(--border))] pb-4 mb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              全网动态
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-6 pb-4">
            <div className="max-h-[340px] space-y-0 overflow-y-auto custom-scrollbar">
              {(timeline ?? []).length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                  暂无活动记录
                </div>
              ) : (
                (timeline ?? []).map((item, index) => (
                  <div key={item.id} className="flex gap-4">
                    {/* Vertical timeline */}
                    <div className="flex flex-col items-center">
                      <Avatar className="h-8 w-8 border-2 border-[hsl(var(--background))] shadow-sm">
                        <AvatarFallback
                          className={`text-xs font-bold ${roleColors[item.userRole] ?? "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"}`}
                        >
                          {(roleLabels[item.userRole] ?? "用")[0]}
                        </AvatarFallback>
                      </Avatar>
                      {index < (timeline ?? []).length - 1 && (
                        <div className="w-[2px] flex-1 bg-[hsl(var(--border))] my-1 rounded-full" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1 pb-6 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                          {item.action}
                        </span>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-[hsl(var(--border))]">
                          {roleLabels[item.userRole] ?? item.userRole}
                        </Badge>
                      </div>
                      {item.detail && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5 leading-relaxed">
                          {item.detail}
                        </p>
                      )}
                      <p className="text-[10px] font-medium text-[hsl(var(--muted-foreground))/70]">
                        {formatRelativeTime(item.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

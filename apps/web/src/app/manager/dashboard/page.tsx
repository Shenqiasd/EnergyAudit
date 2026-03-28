"use client";

import { Activity, AlertTriangle, CheckCircle, Layers } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProgressBoard } from "@/components/dashboard/progress-board";
import { AlertList } from "@/components/dashboard/alert-list";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import {
  useDashboardSummary,
  useAlerts,
  useTimeline,
} from "@/lib/api/hooks/use-statistics";

export default function ManagerDashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const { data: timeline, isLoading: timelineLoading } = useTimeline();

  const isLoading = summaryLoading || alertsLoading || timelineLoading;

  if (isLoading) {
    return <Loading />;
  }

  const kpiCards = [
    {
      icon: Layers,
      label: "活跃批次数",
      value: summary?.activeBatches ?? 0,
    },
    {
      icon: CheckCircle,
      label: "项目完成率",
      value: summary
        ? `${(summary.projectCompletionRate * 100).toFixed(1)}%`
        : "0%",
    },
    {
      icon: Activity,
      label: "待审核任务",
      value: summary?.pendingReviewTasks ?? 0,
    },
    {
      icon: AlertTriangle,
      label: "超期预警",
      value: summary?.overdueAlerts ?? 0,
    },
  ];

  const progressItems = [
    {
      label: "项目完成",
      value: Math.round((summary?.projectCompletionRate ?? 0) * 100),
      total: 100,
    },
    {
      label: "待审核处理",
      value: summary?.pendingReviewTasks ?? 0,
      total: Math.max(summary?.pendingReviewTasks ?? 0, 1),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">工作台</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          管理端工作台 — 审计工作总览、项目进度、审核状态统计
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <KpiCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
          />
        ))}
      </div>

      {/* Middle Section: Progress Board + Alert List */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProgressBoard title="批次进度概览" items={progressItems} />
        <AlertList title="预警提醒" alerts={alerts ?? []} />
      </div>

      {/* Bottom: Recent Activity Timeline */}
      <ActivityTimeline title="最近操作记录" items={timeline ?? []} />
    </div>
  );
}

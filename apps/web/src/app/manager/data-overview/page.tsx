"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { Table } from "@/components/ui/table";
import { useDataModules } from "@/lib/api/hooks/use-data-entry";
import { Database } from "lucide-react";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "primary" | "success" | "warning" | "danger";
  }
> = {
  not_started: { label: "未开始", variant: "default" },
  draft: { label: "草稿", variant: "default" },
  saved: { label: "已保存", variant: "primary" },
  validation_failed: { label: "校验失败", variant: "danger" },
  ready_to_submit: { label: "待提交", variant: "warning" },
  submitted: { label: "已提交", variant: "success" },
  returned: { label: "已退回", variant: "danger" },
  archived: { label: "已归档", variant: "default" },
};

export default function ManagerDataOverviewPage() {
  const { data: modules, isLoading } = useDataModules();

  if (isLoading) return <Loading />;

  const totalModules = modules?.length ?? 0;
  const submittedCount =
    modules?.filter((m) => m.recordStatus === "submitted").length ?? 0;
  const inProgressCount =
    modules?.filter(
      (m) =>
        m.recordStatus &&
        m.recordStatus !== "not_started" &&
        m.recordStatus !== "submitted",
    ).length ?? 0;
  const notStartedCount = totalModules - submittedCount - inProgressCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
          填报概览
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          查看所有企业的数据填报进度
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            总模块数
          </p>
          <p className="mt-1 text-2xl font-bold text-[hsl(var(--foreground))]">
            {totalModules}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">已提交</p>
          <p className="mt-1 text-2xl font-bold text-[hsl(var(--success))]">
            {submittedCount}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">填报中</p>
          <p className="mt-1 text-2xl font-bold text-[hsl(var(--primary))]">
            {inProgressCount}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">未开始</p>
          <p className="mt-1 text-2xl font-bold text-[hsl(var(--foreground))]">
            {notStartedCount}
          </p>
        </Card>
      </div>

      {/* Module Completion Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Database size={20} />
              模块填报进度
            </span>
          </CardTitle>
        </CardHeader>
        {modules && modules.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <th className="text-left">模块名称</th>
                <th className="text-left">分类</th>
                <th className="text-left">状态</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => {
                const status =
                  statusConfig[mod.recordStatus ?? "not_started"] ??
                  statusConfig.not_started;
                return (
                  <tr key={mod.code}>
                    <td className="font-medium">{mod.name}</td>
                    <td className="text-[hsl(var(--muted-foreground))]">
                      {mod.category}
                    </td>
                    <td>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            暂无模块数据
          </p>
        )}
      </Card>
    </div>
  );
}

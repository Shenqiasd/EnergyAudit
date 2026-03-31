"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/list/filter-bar";
import { ListPageSkeleton } from "@/components/skeleton/list-skeleton";
import { AlertTriangle, Wrench } from "lucide-react";
import {
  useRectificationTasks,
  useRectificationStats,
} from "@/lib/api/hooks/use-rectifications";
import type { RectificationTask } from "@/lib/api/hooks/use-rectifications";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  pending_issue: "待下发",
  pending_claim: "待认领",
  in_progress: "整改中",
  pending_acceptance: "待验收",
  completed: "已完成",
  delayed: "已延期",
  closed: "已关闭",
};

const STATUS_VARIANTS: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
  pending_issue: "default",
  pending_claim: "primary",
  in_progress: "warning",
  pending_acceptance: "warning",
  completed: "success",
  delayed: "danger",
  closed: "default",
};

export default function ManagerRectificationsPage() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useRectificationTasks({
    status: statusFilter || undefined,
  });
  const { data: stats } = useRectificationStats();

  const items = data?.items ?? [];
  const filteredItems = searchText
    ? items.filter((t) => t.title.toLowerCase().includes(searchText.toLowerCase()))
    : items;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  const columns: ColumnDef<RectificationTask, unknown>[] = [
    {
      accessorKey: "title",
      header: "整改任务",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "auditProjectId",
      header: "项目ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.auditProjectId.slice(0, 12)}...</span>
      ),
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Badge variant={STATUS_VARIANTS[row.original.status] ?? "default"}>
            {STATUS_LABELS[row.original.status] ?? row.original.status}
          </Badge>
          {row.original.isOverdue && (
            <Badge variant="danger">
              <AlertTriangle size={12} className="mr-0.5" />
              延期
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "deadline",
      header: "截止日期",
      cell: ({ row }) => formatDate(row.original.deadline),
    },
    {
      accessorKey: "createdAt",
      header: "创建日期",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: "操作",
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push(`/manager/rectifications/${row.original.id}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="整改监管"
        description="监管企业整改进度"
      />

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.total}</div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">总计</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.completionRate}</div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">完成率</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{stats.overdueCount}</div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">延期数</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">
              {stats.statusCounts["in_progress"] ?? 0}
            </div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">进行中</div>
          </Card>
        </div>
      )}

      <FilterBar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="搜索整改任务..."
        filters={[
          {
            key: "status",
            label: "整改状态",
            options: [
              { value: "", label: "全部状态" },
              { value: "pending_issue", label: "待下发" },
              { value: "pending_claim", label: "待认领" },
              { value: "in_progress", label: "整改中" },
              { value: "pending_acceptance", label: "待验收" },
              { value: "completed", label: "已完成" },
              { value: "delayed", label: "已延期" },
              { value: "closed", label: "已关闭" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
      />

      {isLoading ? (
        <ListPageSkeleton rows={5} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<Wrench className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />}
          title="暂无整改任务"
          description="所有问题已处理完毕"
        />
      ) : (
        <DataTable columns={columns} data={filteredItems} />
      )}
    </div>
  );
}

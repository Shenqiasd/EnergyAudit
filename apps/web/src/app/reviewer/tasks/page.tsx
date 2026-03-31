"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/list/filter-bar";
import { useReviewTasks } from "@/lib/api/hooks/use-reviews";
import type { ReviewTask } from "@/lib/api/hooks/use-reviews";

const STATUS_LABELS: Record<string, string> = {
  pending_assignment: "待分配",
  assigned: "已分配",
  in_review: "审核中",
  pending_confirmation: "待确认",
  returned: "已退回",
  completed: "已完成",
  closed: "已关闭",
};

const STATUS_VARIANTS: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
  pending_assignment: "default",
  assigned: "primary",
  in_review: "warning",
  pending_confirmation: "warning",
  returned: "danger",
  completed: "success",
  closed: "default",
};

export default function ReviewerTasksPage() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useReviewTasks({
    status: statusFilter || undefined,
  });

  const items = data?.items ?? [];
  const filteredItems = searchText
    ? items.filter((t) => t.auditProjectId.includes(searchText) || t.id.includes(searchText))
    : items;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  const columns: ColumnDef<ReviewTask, unknown>[] = [
    {
      accessorKey: "id",
      header: "任务ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.id.slice(0, 12)}...</span>
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
        <Badge variant={STATUS_VARIANTS[row.original.status] ?? "default"}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "totalScore",
      header: "评分",
      cell: ({ row }) => row.original.totalScore ?? "-",
    },
    {
      accessorKey: "assignedAt",
      header: "分配时间",
      cell: ({ row }) => formatDate(row.original.assignedAt),
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
        <div className="flex items-center gap-2">
          <Link href={`/reviewer/tasks/${row.original.id}`}>
            <Button size="sm" variant="ghost">
              查看详情
            </Button>
          </Link>
          {row.original.status === "assigned" && (
            <Link href={`/reviewer/tasks/${row.original.id}`}>
              <Button size="sm" variant="secondary">
                <Play size={14} className="mr-1" />
                开始审核
              </Button>
            </Link>
          )}
          {row.original.status === "in_review" && (
            <Link href={`/reviewer/tasks/${row.original.id}`}>
              <Button size="sm" variant="secondary">
                <Send size={14} className="mr-1" />
                提交结论
              </Button>
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="我的审核任务"
        description="查看分配给我的审核任务，进行审核评分"
      />

      <FilterBar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="搜索任务ID或项目ID..."
        filters={[
          {
            key: "status",
            label: "任务状态",
            options: [
              { value: "", label: "全部状态" },
              { value: "assigned", label: "已分配" },
              { value: "in_review", label: "审核中" },
              { value: "pending_confirmation", label: "待确认" },
              { value: "returned", label: "已退回" },
              { value: "completed", label: "已完成" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
      />

      {isLoading ? (
        <PageLoading />
      ) : filteredItems.length === 0 ? (
        <EmptyState title="暂无审核任务" description="审核任务将在管理员分配后显示" />
      ) : (
        <DataTable columns={columns} data={filteredItems} />
      )}
    </div>
  );
}

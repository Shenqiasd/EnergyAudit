"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/list/filter-bar";
import { ListPageSkeleton } from "@/components/skeleton/list-skeleton";
import { Shield } from "lucide-react";
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

export default function ManagerReviewsPage() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useReviewTasks({
    status: statusFilter || undefined,
  });

  const items = data?.items ?? [];
  const filteredItems = searchText
    ? items.filter((t) => t.auditProjectId.includes(searchText) || t.reviewerId.includes(searchText))
    : items;

  const columns: ColumnDef<ReviewTask, unknown>[] = [
    {
      accessorKey: "id",
      header: "审核任务ID",
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
      accessorKey: "reviewerId",
      header: "审核员",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.reviewerId.slice(0, 12)}...</span>
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
      accessorKey: "createdAt",
      header: "创建日期",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("zh-CN"),
    },
    {
      id: "actions",
      header: "操作",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link href={`/manager/reviews/${row.original.id}`}>
            <Button size="sm" variant="ghost">
              查看详情
            </Button>
          </Link>
          {row.original.status === "pending_assignment" && (
            <Button size="sm" variant="secondary">
              <UserPlus size={14} className="mr-1" />
              分配
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="审核管理"
        description="分派和管理审核任务"
      />

      <FilterBar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="搜索项目ID或审核员..."
        filters={[
          {
            key: "status",
            label: "审核状态",
            options: [
              { value: "", label: "全部状态" },
              { value: "pending_assignment", label: "待分配" },
              { value: "assigned", label: "已分配" },
              { value: "in_review", label: "审核中" },
              { value: "pending_confirmation", label: "待确认" },
              { value: "returned", label: "已退回" },
              { value: "completed", label: "已完成" },
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
          icon={<Shield className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />}
          title="暂无审核任务"
          description="还没有需要审核的报告"
        />
      ) : (
        <DataTable columns={columns} data={filteredItems} />
      )}
    </div>
  );
}

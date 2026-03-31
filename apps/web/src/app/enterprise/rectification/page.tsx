"use client";

import { useState } from "react";
import Link from "next/link";
import { Hand } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/list/filter-bar";
import { ListPageSkeleton } from "@/components/skeleton/list-skeleton";
import { Wrench } from "lucide-react";
import {
  useRectificationTasks,
  useClaimRectification,
} from "@/lib/api/hooks/use-rectifications";
import type { RectificationTask } from "@/lib/api/hooks/use-rectifications";

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

function ClaimButton({ taskId }: { taskId: string }) {
  const claimTask = useClaimRectification(taskId);
  return (
    <Button
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        claimTask.mutate();
      }}
      disabled={claimTask.isPending}
    >
      <Hand size={14} className="mr-1" />
      {claimTask.isPending ? "认领中..." : "认领"}
    </Button>
  );
}

export default function EnterpriseRectificationPage() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useRectificationTasks({
    status: statusFilter || undefined,
  });

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
      header: "任务名称",
      cell: ({ row }) => (
        <Link href={`/enterprise/rectification/${row.original.id}`} className="font-medium hover:underline">
          {row.original.title}
        </Link>
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
          {row.original.isOverdue && <Badge variant="danger">延期</Badge>}
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
        <div className="flex items-center gap-2">
          <Link href={`/enterprise/rectification/${row.original.id}`}>
            <Button size="sm" variant="ghost">
              查看详情
            </Button>
          </Link>
          {row.original.status === "pending_claim" && (
            <ClaimButton taskId={row.original.id} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="我的整改任务"
        description="查看审核发现的问题，提交整改方案和完成情况"
      />

      <FilterBar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="搜索整改任务..."
        filters={[
          {
            key: "status",
            label: "任务状态",
            options: [
              { value: "", label: "全部状态" },
              { value: "pending_claim", label: "待认领" },
              { value: "in_progress", label: "整改中" },
              { value: "pending_acceptance", label: "待验收" },
              { value: "completed", label: "已完成" },
              { value: "delayed", label: "已延期" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
      />

      {isLoading ? (
        <ListPageSkeleton rows={5} showFilterSkeleton={false} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<Wrench className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />}
          title="暂无整改任务"
          description="审核通过无需整改"
        />
      ) : (
        <DataTable columns={columns} data={filteredItems} />
      )}
    </div>
  );
}

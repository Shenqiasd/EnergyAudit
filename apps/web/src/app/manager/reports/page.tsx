"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/list/filter-bar";
import { ListPageSkeleton } from "@/components/skeleton/list-skeleton";
import { FileText, RefreshCw } from "lucide-react";
import { useReports } from "@/lib/api/hooks/use-reports";
import type { Report } from "@/lib/api/hooks/use-reports";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  not_generated: "未生成",
  system_draft: "系统草稿",
  enterprise_revision: "企业修订",
  pending_final: "待终版",
  final_uploaded: "已上传终版",
  under_review: "审核中",
  archived: "已归档",
  voided: "已作废",
};

const STATUS_VARIANTS: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
  not_generated: "default",
  system_draft: "primary",
  enterprise_revision: "warning",
  pending_final: "warning",
  final_uploaded: "success",
  under_review: "primary",
  archived: "default",
  voided: "danger",
};

export default function ManagerReportsPage() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading, refetch } = useReports({
    status: statusFilter || undefined,
  });

  const items = data?.items ?? [];
  const filteredItems = searchText
    ? items.filter((r) => r.id.includes(searchText) || r.auditProjectId.includes(searchText))
    : items;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("zh-CN");
  };

  const columns: ColumnDef<Report, unknown>[] = [
    {
      accessorKey: "id",
      header: "报告ID",
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
      accessorKey: "version",
      header: "版本",
      cell: ({ row }) => `v${row.original.version}`,
    },
    {
      accessorKey: "versionType",
      header: "类型",
      cell: ({ row }) =>
        row.original.versionType === "system_draft"
          ? "系统草稿"
          : row.original.versionType === "enterprise_revision"
            ? "企业修订"
            : row.original.versionType,
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
      accessorKey: "generatedAt",
      header: "生成日期",
      cell: ({ row }) => formatDate(row.original.generatedAt),
    },
    {
      id: "actions",
      header: "操作",
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push(`/manager/reports/${row.original.id}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="报告管理"
        description="管理审计报告的全生命周期"
        actions={
          <Button variant="secondary" onClick={() => void refetch()}>
            <RefreshCw size={16} />
            刷新
          </Button>
        }
      />

      <FilterBar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="搜索报告ID或项目ID..."
        filters={[
          {
            key: "status",
            label: "报告状态",
            options: [
              { value: "", label: "全部状态" },
              { value: "not_generated", label: "未生成" },
              { value: "system_draft", label: "系统草稿" },
              { value: "enterprise_revision", label: "企业修订" },
              { value: "pending_final", label: "待终版" },
              { value: "final_uploaded", label: "已上传终版" },
              { value: "under_review", label: "审核中" },
              { value: "archived", label: "已归档" },
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
          icon={<FileText className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />}
          title="暂无报告"
          description="完成数据填报后生成报告"
        />
      ) : (
        <DataTable columns={columns} data={filteredItems} />
      )}
    </div>
  );
}

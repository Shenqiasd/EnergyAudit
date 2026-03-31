"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { ListPageSkeleton } from "@/components/skeleton/list-skeleton";
import { FileText } from "lucide-react";
import { useReports } from "@/lib/api/hooks/use-reports";
import type { Report } from "@/lib/api/hooks/use-reports";

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

export default function EnterpriseReportsPage() {
  const { data, isLoading } = useReports();

  const items = data?.items ?? [];

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
      accessorKey: "version",
      header: "版本",
      cell: ({ row }) => `v${row.original.version}`,
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
      header: "生成时间",
      cell: ({ row }) => formatDate(row.original.generatedAt),
    },
    {
      id: "actions",
      header: "操作",
      enableSorting: false,
      cell: ({ row }) => (
        <Link href={`/enterprise/reports/${row.original.id}`}>
          <Button size="sm" variant="ghost">
            查看
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="我的审计报告"
        description="查看和管理审计报告，上传终版报告"
      />

      {isLoading ? (
        <ListPageSkeleton rows={5} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />}
          title="暂无审计报告"
          description="完成填报后报告将在此显示"
        />
      ) : (
        <DataTable columns={columns} data={items} />
      )}
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { ListPageSkeleton } from "@/components/skeleton/list-skeleton";
import { AlertTriangle, ClipboardCheck } from "lucide-react";
import { useAuditProjects, type AuditProject } from "@/lib/api/hooks/use-audit-projects";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  pending_start: "待启动",
  configuring: "配置中",
  filing: "填报中",
  pending_submit: "待提交",
  pending_report: "待生成报告",
  report_processing: "报告处理中",
  pending_review: "待审核",
  in_review: "审核中",
  pending_rectification: "待整改",
  in_rectification: "整改中",
  completed: "已完成",
  closed: "已关闭",
};

const STATUS_VARIANTS: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
  pending_start: "default",
  configuring: "primary",
  filing: "primary",
  pending_submit: "warning",
  pending_report: "warning",
  report_processing: "warning",
  pending_review: "warning",
  in_review: "primary",
  pending_rectification: "danger",
  in_rectification: "danger",
  completed: "success",
  closed: "default",
};

export default function EnterpriseProjectsPage() {
  const router = useRouter();
  const { data, isLoading } = useAuditProjects({ pageSize: 50 });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  const items = data?.items ?? [];

  const columns: ColumnDef<AuditProject, unknown>[] = [
    {
      accessorKey: "batchName",
      header: "批次",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.batchName ?? "-"}</span>
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
              已逾期
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
          onClick={() => router.push(`/enterprise/projects/${row.original.id}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="我的审计项目"
        description="查看分配给本企业的审计项目"
      />

      {isLoading ? (
        <ListPageSkeleton rows={5} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />}
          title="暂无审计项目"
          description="企业准入后将分配项目"
        />
      ) : (
        <DataTable columns={columns} data={items} />
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/list/filter-bar";
import { ListPageSkeleton } from "@/components/skeleton/list-skeleton";
import { AlertTriangle, ClipboardCheck } from "lucide-react";
import { useAuditProjects, type AuditProject } from "@/lib/api/hooks/use-audit-projects";
import { useAuditBatches } from "@/lib/api/hooks/use-audit-batches";
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

const ALL_STATUSES = Object.keys(STATUS_LABELS);

export default function ManagerProjectsPage() {
  const router = useRouter();
  const [searchName, setSearchName] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: batchesData } = useAuditBatches({ pageSize: 100 });
  const { data, isLoading } = useAuditProjects({
    batchId: batchFilter || undefined,
    status: statusFilter || undefined,
    enterpriseName: searchName || undefined,
    pageSize: 200,
  });

  const batchOptions = useMemo(() => {
    const items = batchesData?.items ?? [];
    return [
      { value: "", label: "全部批次" },
      ...items.map((b) => ({ value: b.id, label: b.name })),
    ];
  }, [batchesData]);

  const statusOptions = [
    { value: "", label: "全部状态" },
    ...ALL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s })),
  ];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  const items = data?.items ?? [];

  const columns: ColumnDef<AuditProject, unknown>[] = [
    {
      accessorKey: "enterpriseName",
      header: "企业名称",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.enterpriseName ?? "未知企业"}</span>
      ),
    },
    {
      accessorKey: "batchName",
      header: "批次",
      cell: ({ row }) => row.original.batchName ?? "-",
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
              逾期
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
          onClick={() => router.push(`/manager/projects/${row.original.id}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="项目管理"
        description="管理所有审计项目的生命周期"
      />

      <FilterBar
        searchValue={searchName}
        onSearchChange={setSearchName}
        searchPlaceholder="搜索企业名称..."
        filters={[
          {
            key: "status",
            label: "项目状态",
            options: statusOptions,
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            key: "batch",
            label: "批次",
            options: batchOptions,
            value: batchFilter,
            onChange: setBatchFilter,
          },
        ]}
      />

      {isLoading ? (
        <ListPageSkeleton rows={5} showFilterSkeleton={false} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />}
          title="暂无项目"
          description="在批次中创建审计项目"
          action={
            <Button variant="secondary" onClick={() => router.push('/manager/batches')}>
              查看批次
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={items} pageSize={20} />
      )}
    </div>
  );
}

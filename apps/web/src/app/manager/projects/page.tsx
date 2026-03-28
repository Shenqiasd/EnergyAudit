"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import { ClipboardCheck, Clock, AlertTriangle } from "lucide-react";
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

const KANBAN_COLUMNS = [
  "pending_start",
  "configuring",
  "filing",
  "pending_submit",
  "pending_report",
  "report_processing",
  "pending_review",
  "in_review",
  "pending_rectification",
  "in_rectification",
  "completed",
  "closed",
];

export default function ManagerProjectsPage() {
  const router = useRouter();
  const [batchFilter, setBatchFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: batchesData } = useAuditBatches({ pageSize: 100 });
  const { data, isLoading } = useAuditProjects({
    batchId: batchFilter || undefined,
    status: statusFilter || undefined,
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
    ...KANBAN_COLUMNS.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s })),
  ];

  const grouped = useMemo(() => {
    const map: Record<string, AuditProject[]> = {};
    for (const col of KANBAN_COLUMNS) {
      map[col] = [];
    }
    for (const proj of data?.items ?? []) {
      if (map[proj.status]) {
        map[proj.status].push(proj);
      }
    }
    return map;
  }, [data]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">项目管理</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            管理审计项目的全生命周期，跟踪项目进度
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-48">
          <Select
            options={batchOptions}
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <PageLoading />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((status) => {
            const items = grouped[status] ?? [];
            if (statusFilter && status !== statusFilter) return null;
            return (
              <div key={status} className="flex-shrink-0 w-64">
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant={STATUS_VARIANTS[status] ?? "default"}>
                    {STATUS_LABELS[status] ?? status}
                  </Badge>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    ({items.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map((proj) => (
                    <Card
                      key={proj.id}
                      className={`cursor-pointer transition-shadow hover:shadow-md ${proj.isOverdue ? "border-[var(--color-danger)] border-2" : ""}`}
                      onClick={() => router.push(`/manager/projects/${proj.id}`)}
                    >
                      <div className="space-y-2">
                        <p className="font-medium text-sm text-[var(--color-text)]">
                          {proj.enterpriseName ?? "未知企业"}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                          <Clock size={12} />
                          {formatDate(proj.deadline)}
                        </div>
                        {proj.isOverdue && (
                          <div className="flex items-center gap-1 text-xs text-[var(--color-danger)]">
                            <AlertTriangle size={12} />
                            已逾期
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                  {items.length === 0 && (
                    <p className="text-xs text-center text-[var(--color-text-secondary)] py-4">
                      暂无项目
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

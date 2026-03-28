"use client";

import { useState, useEffect } from "react";
import { Cpu, RefreshCw, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useJobs, useRetryJob } from "@/lib/api/hooks/use-jobs";
import type { Job } from "@/lib/api/hooks/use-jobs";

const JOB_TYPE_LABELS: Record<string, string> = {
  "enterprise-sync": "企业同步",
  "report-generation": "报告生成",
  "batch-import": "批量导入",
  "batch-assignment": "批量分配",
};

const JOB_STATUS_MAP: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "default" | "primary" }
> = {
  queued: { label: "排队中", variant: "default" },
  processing: { label: "处理中", variant: "primary" },
  completed: { label: "已完成", variant: "success" },
  failed: { label: "失败", variant: "danger" },
};

function JobStatusBadge({ status }: { status: string }) {
  const config = JOB_STATUS_MAP[status] ?? {
    label: status,
    variant: "default" as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function ManagerJobsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, refetch } = useJobs({
    page,
    pageSize: 20,
    status: statusFilter || undefined,
  });

  const hasRunningJobs = data?.items.some(
    (job: Job) => job.status === "processing" || job.status === "queued",
  );

  useEffect(() => {
    if (!hasRunningJobs) return;
    const interval = setInterval(() => {
      void refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [hasRunningJobs, refetch]);

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            任务监控
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            查看异步任务执行状态，支持重试失败任务
          </p>
        </div>
        <Button variant="secondary" onClick={() => void refetch()}>
          <RefreshCw size={16} />
          刷新
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Cpu size={20} />
              任务列表
            </span>
          </CardTitle>
        </CardHeader>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              placeholder="任务状态"
              options={[
                { value: "", label: "全部状态" },
                { value: "queued", label: "排队中" },
                { value: "processing", label: "处理中" },
                { value: "completed", label: "已完成" },
                { value: "failed", label: "失败" },
              ]}
            />
          </div>
        </div>

        {isLoading ? (
          <PageLoading />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>完成时间</TableHead>
                  <TableHead>结果</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((job: Job) => (
                  <JobRow key={job.id} job={job} />
                ))}
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-[var(--color-text-secondary)]"
                    >
                      暂无任务数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  共 {data?.total} 条记录
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    上一页
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function JobRow({ job }: { job: Job }) {
  const retryMutation = useRetryJob(job.id);

  return (
    <TableRow>
      <TableCell className="font-medium">
        {JOB_TYPE_LABELS[job.type] ?? job.type}
      </TableCell>
      <TableCell>
        <JobStatusBadge status={job.status} />
      </TableCell>
      <TableCell className="text-sm">
        {new Date(job.createdAt).toLocaleString("zh-CN")}
      </TableCell>
      <TableCell className="text-sm text-[var(--color-text-secondary)]">
        {job.completedAt
          ? new Date(job.completedAt).toLocaleString("zh-CN")
          : "-"}
      </TableCell>
      <TableCell className="max-w-xs truncate text-sm text-[var(--color-text-secondary)]">
        {job.error ?? (job.result ? "成功" : "-")}
      </TableCell>
      <TableCell>
        {job.status === "failed" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
          >
            <RotateCcw size={14} />
            重试
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

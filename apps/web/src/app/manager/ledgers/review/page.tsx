"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  useReviewLedger,
  useExportLedger,
} from "@/lib/api/hooks/use-ledgers";
import type { ReviewLedgerQuery } from "@/lib/api/hooks/use-ledgers";

const statusLabels: Record<string, string> = {
  pending_assignment: "待分配",
  assigned: "已分配",
  in_review: "审核中",
  pending_confirmation: "待确认",
  returned: "已退回",
  completed: "已完成",
  closed: "已关闭",
};

export default function ReviewLedgerPage() {
  const [query, setQuery] = useState<ReviewLedgerQuery>({
    page: 1,
    pageSize: 20,
  });

  const { data, isLoading } = useReviewLedger(query);
  const exportMutation = useExportLedger("review");

  const handleExport = () => {
    exportMutation.mutate(query as Record<string, unknown>);
  };

  const handlePageChange = (newPage: number) => {
    setQuery((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">审核台账</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            审核任务总览，支持筛选和导出
          </p>
        </div>
        <Button onClick={handleExport} disabled={exportMutation.isPending}>
          {exportMutation.isPending ? "导出中..." : "导出 CSV"}
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[hsl(var(--muted-foreground))]">批次ID:</label>
            <input
              type="text"
              placeholder="输入批次ID"
              value={query.batchId ?? ""}
              onChange={(e) =>
                setQuery((prev) => ({ ...prev, batchId: e.target.value || undefined, page: 1 }))
              }
              className="rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[hsl(var(--muted-foreground))]">审核人ID:</label>
            <input
              type="text"
              placeholder="审核人ID"
              value={query.reviewerId ?? ""}
              onChange={(e) =>
                setQuery((prev) => ({ ...prev, reviewerId: e.target.value || undefined, page: 1 }))
              }
              className="rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[hsl(var(--muted-foreground))]">状态:</label>
            <select
              value={query.status ?? ""}
              onChange={(e) =>
                setQuery((prev) => ({ ...prev, status: e.target.value || undefined, page: 1 }))
              }
              className="rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm"
            >
              <option value="">全部</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Loading />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>审核任务ID</TableHead>
                <TableHead>企业名称</TableHead>
                <TableHead>审核人</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>总分</TableHead>
                <TableHead>问题数</TableHead>
                <TableHead>完成时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length ? (
                data.items.map((item) => (
                  <TableRow key={item.reviewTaskId}>
                    <TableCell className="font-mono text-xs">
                      {item.reviewTaskId}
                    </TableCell>
                    <TableCell className="font-medium">{item.enterpriseName}</TableCell>
                    <TableCell>{item.reviewerId}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "completed" || item.status === "closed"
                            ? "success"
                            : item.status === "returned"
                              ? "danger"
                              : "primary"
                        }
                      >
                        {statusLabels[item.status] ?? item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.totalScore ?? "-"}</TableCell>
                    <TableCell>{item.issueCount}</TableCell>
                    <TableCell>
                      {item.completedAt
                        ? new Date(item.completedAt).toLocaleDateString("zh-CN")
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                      暂无数据
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {data && data.total > data.pageSize && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                共 {data.total} 条，第 {data.page} 页
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(data.page - 1)}
                  disabled={data.page <= 1}
                >
                  上一页
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(data.page + 1)}
                  disabled={data.page * data.pageSize >= data.total}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
  useEnterpriseLedger,
  useExportLedger,
} from "@/lib/api/hooks/use-ledgers";
import type { EnterpriseLedgerQuery } from "@/lib/api/hooks/use-ledgers";

const statusLabels: Record<string, string> = {
  pending_start: "待开始",
  in_progress: "进行中",
  filing: "填报中",
  submitted: "已提交",
  in_review: "审核中",
  completed: "已完成",
  closed: "已关闭",
};

export default function EnterpriseLedgerPage() {
  const [query, setQuery] = useState<EnterpriseLedgerQuery>({
    page: 1,
    pageSize: 20,
  });

  const { data, isLoading } = useEnterpriseLedger(query);
  const exportMutation = useExportLedger("enterprise");

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
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">企业台账</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            企业审计项目总览，支持筛选和导出
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
            <label className="text-sm text-[hsl(var(--muted-foreground))]">行业:</label>
            <input
              type="text"
              placeholder="行业代码"
              value={query.industryCode ?? ""}
              onChange={(e) =>
                setQuery((prev) => ({ ...prev, industryCode: e.target.value || undefined, page: 1 }))
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
                <TableHead>企业名称</TableHead>
                <TableHead>行业代码</TableHead>
                <TableHead>项目状态</TableHead>
                <TableHead>是否超期</TableHead>
                <TableHead>填报进度</TableHead>
                <TableHead>审核评分</TableHead>
                <TableHead>整改状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length ? (
                data.items.map((item) => (
                  <TableRow key={item.projectId}>
                    <TableCell className="font-medium">{item.enterpriseName}</TableCell>
                    <TableCell>{item.industryCode ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="primary">
                        {statusLabels[item.projectStatus] ?? item.projectStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.isOverdue ? (
                        <Badge variant="danger">超期</Badge>
                      ) : (
                        <Badge variant="success">正常</Badge>
                      )}
                    </TableCell>
                    <TableCell>{(item.filingProgress * 100).toFixed(0)}%</TableCell>
                    <TableCell>{item.reviewScore ?? "-"}</TableCell>
                    <TableCell>
                      {item.rectificationStatus ? (
                        <Badge
                          variant={
                            item.rectificationStatus === "completed"
                              ? "success"
                              : "warning"
                          }
                        >
                          {item.rectificationStatus === "completed"
                            ? "已完成"
                            : "进行中"}
                        </Badge>
                      ) : (
                        "-"
                      )}
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

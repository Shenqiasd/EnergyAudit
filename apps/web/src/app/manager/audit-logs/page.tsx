"use client";

import { useState } from "react";
import { Download, FileText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useAuditLogs } from "@/lib/api/hooks/use-audit-logs";
import type { AuditLog } from "@/lib/api/hooks/use-audit-logs";

const ACTION_LABELS: Record<string, string> = {
  login: "登录",
  data_submit: "数据提交",
  status_transition: "状态变更",
  review_action: "审核操作",
  approval: "审批",
  sync_trigger: "同步触发",
  create: "创建",
  update: "更新",
  delete: "删除",
};

const ACTION_VARIANTS: Record<string, "primary" | "success" | "warning" | "danger" | "default"> = {
  login: "primary",
  data_submit: "success",
  status_transition: "warning",
  review_action: "primary",
  approval: "success",
  sync_trigger: "default",
  create: "success",
  update: "warning",
  delete: "danger",
};

function ActionBadge({ action }: { action: string }) {
  const label = ACTION_LABELS[action] ?? action;
  const variant = ACTION_VARIANTS[action] ?? "default";
  return <Badge variant={variant}>{label}</Badge>;
}

export default function ManagerAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading, refetch } = useAuditLogs({
    page,
    pageSize: 20,
    userId: userId || undefined,
    action: action || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const handleExportCsv = () => {
    if (!data?.items.length) return;

    const headers = ["操作时间", "操作用户", "用户角色", "操作类型", "目标实体", "详情"];
    const rows = data.items.map((log: AuditLog) => [
      new Date(log.createdAt).toLocaleString("zh-CN"),
      log.userId,
      log.userRole,
      ACTION_LABELS[log.action] ?? log.action,
      log.targetType ? `${log.targetType}/${log.targetId ?? ""}` : "",
      log.detail ?? "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            操作日志
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            查看平台操作记录，支持按条件筛选和导出
          </p>
        </div>
        <Button variant="secondary" onClick={handleExportCsv}>
          <Download size={16} />
          导出CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <FileText size={20} />
              日志列表
            </span>
          </CardTitle>
        </CardHeader>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Input
              placeholder="用户ID"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-40">
            <Select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              placeholder="操作类型"
              options={[
                { value: "", label: "全部类型" },
                { value: "login", label: "登录" },
                { value: "data_submit", label: "数据提交" },
                { value: "status_transition", label: "状态变更" },
                { value: "review_action", label: "审核操作" },
                { value: "approval", label: "审批" },
                { value: "sync_trigger", label: "同步触发" },
              ]}
            />
          </div>
          <div className="w-40">
            <Input
              type="date"
              placeholder="开始日期"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-40">
            <Input
              type="date"
              placeholder="结束日期"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            <Search size={14} />
            搜索
          </Button>
        </div>

        {isLoading ? (
          <PageLoading />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>操作时间</TableHead>
                  <TableHead>操作用户</TableHead>
                  <TableHead>操作类型</TableHead>
                  <TableHead>目标实体</TableHead>
                  <TableHead>详情</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((log: AuditLog) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {new Date(log.createdAt).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell className="text-sm">{log.userId}</TableCell>
                    <TableCell>
                      <ActionBadge action={log.action} />
                    </TableCell>
                    <TableCell className="text-sm text-[var(--color-text-secondary)]">
                      {log.targetType
                        ? `${log.targetType}${log.targetId ? `/${log.targetId}` : ""}`
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-[var(--color-text-secondary)]">
                      {log.detail ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-[var(--color-text-secondary)]"
                    >
                      暂无日志数据
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

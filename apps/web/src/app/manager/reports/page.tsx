"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useReports } from "@/lib/api/hooks/use-reports";

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

const STATUS_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "not_generated", label: "未生成" },
  { value: "system_draft", label: "系统草稿" },
  { value: "enterprise_revision", label: "企业修订" },
  { value: "pending_final", label: "待终版" },
  { value: "final_uploaded", label: "已上传终版" },
  { value: "under_review", label: "审核中" },
  { value: "archived", label: "已归档" },
];

export default function ManagerReportsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading, refetch } = useReports({
    status: statusFilter || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">报告管理</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          管理所有项目的审计报告，跟踪报告状态
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <FileText size={20} />
              报告列表
            </span>
          </CardTitle>
          <div className="flex items-center gap-3">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            />
            <Button variant="secondary" size="sm" onClick={() => void refetch()}>
              <RefreshCw size={14} />
              刷新
            </Button>
          </div>
        </CardHeader>

        {isLoading ? (
          <Loading text="加载中..." />
        ) : !data?.items?.length ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            暂无报告数据。
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>报告ID</TableHead>
                <TableHead>版本</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>生成时间</TableHead>
                <TableHead>更新时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-mono text-xs">
                    {report.id.slice(0, 12)}...
                  </TableCell>
                  <TableCell>v{report.version}</TableCell>
                  <TableCell className="text-sm">
                    {report.versionType === "system_draft"
                      ? "系统草稿"
                      : report.versionType === "enterprise_revision"
                        ? "企业修订"
                        : report.versionType}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[report.status] ?? "default"}>
                      {STATUS_LABELS[report.status] ?? report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                    {report.generatedAt
                      ? new Date(report.generatedAt).toLocaleString("zh-CN")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                    {new Date(report.updatedAt).toLocaleString("zh-CN")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

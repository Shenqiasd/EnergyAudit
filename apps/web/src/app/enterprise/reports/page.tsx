"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText } from "lucide-react";
import Link from "next/link";
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

export default function EnterpriseReportsPage() {
  const { data, isLoading } = useReports();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">报告管理</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          查看和管理审计报告，上传终版报告
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
        </CardHeader>

        {isLoading ? (
          <Loading text="加载中..." />
        ) : !data?.items?.length ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            暂无报告数据。报告将在管理员发起计算和生成后显示。
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>报告ID</TableHead>
                <TableHead>版本</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>生成时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-mono text-xs">
                    {report.id.slice(0, 12)}...
                  </TableCell>
                  <TableCell>v{report.version}</TableCell>
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
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/enterprise/reports/${report.id}`}>
                        <Button size="sm" variant="secondary">
                          查看
                        </Button>
                      </Link>
                    </div>
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

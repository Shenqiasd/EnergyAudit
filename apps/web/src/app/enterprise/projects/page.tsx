"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText } from "lucide-react";
import { useAuditProjects } from "@/lib/api/hooks/use-audit-projects";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">我的项目</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          查看分配给本企业的审计项目
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <FileText size={20} />
              项目列表
            </span>
          </CardTitle>
        </CardHeader>

        {isLoading ? (
          <PageLoading />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>批次</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>截止日期</TableHead>
                <TableHead>逾期</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((proj) => (
                <TableRow key={proj.id}>
                  <TableCell className="font-medium">{proj.batchName ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[proj.status] ?? "default"}>
                      {STATUS_LABELS[proj.status] ?? proj.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(proj.deadline)}</TableCell>
                  <TableCell>
                    {proj.isOverdue ? (
                      <Badge variant="danger">已逾期</Badge>
                    ) : (
                      <span className="text-[hsl(var(--muted-foreground))]">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/enterprise/projects/${proj.id}`)}
                    >
                      查看详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!data?.items || data.items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[hsl(var(--muted-foreground))]">
                    暂无项目
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

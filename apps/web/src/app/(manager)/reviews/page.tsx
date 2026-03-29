"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useReviewTasks } from "@/lib/api/hooks/use-reviews";
import { downloadReviewPdf } from "@/lib/download";
import { FileText } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending_assignment: "待分配",
  assigned: "已分配",
  in_review: "审核中",
  pending_confirmation: "待确认",
  returned: "已退回",
  completed: "已完成",
  closed: "已关闭",
};

const statusColors: Record<string, "default" | "success" | "danger" | "warning"> = {
  pending_assignment: "default",
  assigned: "warning",
  in_review: "warning",
  pending_confirmation: "warning",
  returned: "danger",
  completed: "success",
  closed: "default",
};

export default function ManagerReviewsPage() {
  const { data, isLoading } = useReviewTasks();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleExportPdf = async (taskId: string) => {
    setDownloadingId(taskId);
    try {
      await downloadReviewPdf(taskId);
    } catch (err) {
      console.error("审核报告导出失败:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return <Loading size={32} text="加载审核任务..." className="min-h-[400px]" />;
  }

  const tasks = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">审核管理</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          查看和管理审核任务，导出审核报告
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>审核任务列表</CardTitle>
        </CardHeader>
        {tasks.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>任务ID</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>总分</TableHead>
                <TableHead>分配时间</TableHead>
                <TableHead>完成时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-mono text-sm">{task.id}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[task.status] ?? "default"}>
                      {statusLabels[task.status] ?? task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{task.totalScore ?? "未评分"}</TableCell>
                  <TableCell>
                    {task.assignedAt
                      ? new Date(task.assignedAt).toLocaleString("zh-CN")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {task.completedAt
                      ? new Date(task.completedAt).toLocaleString("zh-CN")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportPdf(task.id)}
                      disabled={downloadingId === task.id}
                    >
                      <FileText size={14} />
                      {downloadingId === task.id ? "导出中..." : "导出审核报告"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-12 text-center">
            <p className="text-[var(--color-text-secondary)]">暂无审核任务</p>
          </div>
        )}
      </Card>
    </div>
  );
}

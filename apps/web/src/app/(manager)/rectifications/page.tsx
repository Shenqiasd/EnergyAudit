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
import { useRectificationTasks } from "@/lib/api/hooks/use-rectifications";
import { downloadRectificationPdf } from "@/lib/download";
import { FileText } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending_issue: "待下发",
  pending_claim: "待认领",
  in_progress: "整改中",
  pending_acceptance: "待验收",
  completed: "已完成",
  delayed: "已逾期",
  closed: "已关闭",
};

const statusColors: Record<string, "default" | "success" | "danger" | "warning"> = {
  pending_issue: "default",
  pending_claim: "warning",
  in_progress: "warning",
  pending_acceptance: "warning",
  completed: "success",
  delayed: "danger",
  closed: "default",
};

export default function ManagerRectificationsPage() {
  const { data, isLoading } = useRectificationTasks();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleExportPdf = async (taskId: string) => {
    setDownloadingId(taskId);
    try {
      await downloadRectificationPdf(taskId);
    } catch (err) {
      console.error("整改报告导出失败:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return <Loading size={32} text="加载整改任务..." className="min-h-[400px]" />;
  }

  const tasks = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">整改监控</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          查看和管理整改任务，导出整改报告
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>整改任务列表</CardTitle>
        </CardHeader>
        {tasks.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>截止日期</TableHead>
                <TableHead>逾期</TableHead>
                <TableHead>完成时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[task.status] ?? "default"}>
                      {statusLabels[task.status] ?? task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.deadline
                      ? new Date(task.deadline).toLocaleDateString("zh-CN")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {task.isOverdue ? (
                      <Badge variant="danger">是</Badge>
                    ) : (
                      <span className="text-[hsl(var(--muted-foreground))]">否</span>
                    )}
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
                      {downloadingId === task.id ? "导出中..." : "导出整改报告"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-12 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">暂无整改任务</p>
          </div>
        )}
      </Card>
    </div>
  );
}

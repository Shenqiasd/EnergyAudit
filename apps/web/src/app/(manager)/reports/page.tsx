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
import { useReports } from "@/lib/api/hooks/use-reports";
import { downloadReportPdf, downloadReportDocx } from "@/lib/download";
import { FileText, FileDown } from "lucide-react";

const statusLabels: Record<string, string> = {
  not_generated: "未生成",
  system_draft: "系统草稿",
  enterprise_revision: "企业修订中",
  pending_final: "待定稿",
  final_uploaded: "已上传定稿",
  under_review: "审核中",
  archived: "已归档",
  voided: "已作废",
};

const statusColors: Record<string, "default" | "success" | "danger" | "warning"> = {
  not_generated: "default",
  system_draft: "warning",
  enterprise_revision: "warning",
  pending_final: "warning",
  final_uploaded: "success",
  under_review: "warning",
  archived: "success",
  voided: "danger",
};

export default function ManagerReportsPage() {
  const { data, isLoading } = useReports();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPdf = async (reportId: string) => {
    setDownloadingId(reportId);
    try {
      await downloadReportPdf(reportId);
    } catch (err) {
      console.error("PDF下载失败:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadDocx = async (reportId: string) => {
    setDownloadingId(reportId);
    try {
      await downloadReportDocx(reportId);
    } catch (err) {
      console.error("Word下载失败:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return <Loading size={32} text="加载报告列表..." className="min-h-[400px]" />;
  }

  const reports = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">报告管理</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          查看和管理所有审计报告
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>报告列表</CardTitle>
        </CardHeader>
        {reports.length > 0 ? (
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
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-mono text-sm">{report.id}</TableCell>
                  <TableCell>V{report.version}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[report.status] ?? "default"}>
                      {statusLabels[report.status] ?? report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {report.generatedAt
                      ? new Date(report.generatedAt).toLocaleString("zh-CN")
                      : "未生成"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPdf(report.id)}
                        disabled={downloadingId === report.id}
                      >
                        <FileText size={14} />
                        PDF
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadDocx(report.id)}
                        disabled={downloadingId === report.id}
                      >
                        <FileDown size={14} />
                        Word
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-12 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">暂无报告</p>
          </div>
        )}
      </Card>
    </div>
  );
}

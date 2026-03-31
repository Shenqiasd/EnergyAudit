"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
import { useReport } from "@/lib/api/hooks/use-reports";
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

export default function EnterpriseReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;
  const { data: report, isLoading } = useReport(reportId);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    setDownloading("pdf");
    try {
      await downloadReportPdf(reportId);
    } catch (err) {
      console.error("PDF下载失败:", err);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadDocx = async () => {
    setDownloading("docx");
    try {
      await downloadReportDocx(reportId);
    } catch (err) {
      console.error("Word下载失败:", err);
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading) {
    return <Loading size={32} text="加载报告..." className="min-h-[400px]" />;
  }

  if (!report) {
    return (
      <Card>
        <div className="py-12 text-center">
          <p className="text-[hsl(var(--muted-foreground))]">报告不存在</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">审计报告</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            版本 V{report.version} · {statusLabels[report.status] ?? report.status}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={downloading !== null}
          >
            <FileText size={16} />
            {downloading === "pdf" ? "下载中..." : "下载PDF"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadDocx}
            disabled={downloading !== null}
          >
            <FileDown size={16} />
            {downloading === "docx" ? "下载中..." : "下载Word"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            报告信息
            <Badge variant={statusColors[report.status] ?? "default"}>
              {statusLabels[report.status] ?? report.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6 text-sm text-[hsl(var(--muted-foreground))]">
          <p>生成时间：{report.generatedAt ? new Date(report.generatedAt).toLocaleString("zh-CN") : "未生成"}</p>
          <p>创建时间：{new Date(report.createdAt).toLocaleString("zh-CN")}</p>
        </div>
      </Card>

      {report.sections && report.sections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>报告章节</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>序号</TableHead>
                <TableHead>章节</TableHead>
                <TableHead>内容预览</TableHead>
                <TableHead>图表</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.sections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell>{section.sortOrder}</TableCell>
                  <TableCell className="font-medium">{section.sectionName}</TableCell>
                  <TableCell className="max-w-xs truncate text-[hsl(var(--muted-foreground))]">
                    {section.content ?? "暂无内容"}
                  </TableCell>
                  <TableCell>
                    {section.charts && section.charts.length > 0
                      ? section.charts.map((c) => c.title).join(", ")
                      : "无"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

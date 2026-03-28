"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { EnergyBarChart } from "@/components/charts/energy-bar-chart";
import { EnergyPieChart } from "@/components/charts/energy-pie-chart";
import { SankeyDiagram } from "@/components/charts/sankey-diagram";
import { useReport, useReportVersions } from "@/lib/api/hooks/use-reports";
import { useChartData } from "@/lib/api/hooks/use-charts";
import { ChevronLeft, Download, FileText, Upload } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

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

function SectionChartRenderer({
  chart,
  projectId,
}: {
  chart: { chartCode: string; chartType: string; title: string };
  projectId: string;
}) {
  const { data } = useChartData(projectId, chart.chartCode);

  if (!data?.data) return null;

  const chartData = data.data as Record<string, unknown>;

  if (chart.chartType === "pie") {
    const items = (chartData["data"] as Array<{ label: string; value: number }>) ?? [];
    return <EnergyPieChart title={chart.title} data={items} />;
  }

  if (chart.chartType === "bar") {
    const items = (chartData["data"] as Array<{ label: string; value: number }>) ?? [];
    return (
      <EnergyBarChart
        title={chart.title}
        data={items}
        xAxis={chartData["xAxis"] as string | undefined}
        yAxis={chartData["yAxis"] as string | undefined}
      />
    );
  }

  if (chart.chartType === "sankey") {
    const nodes = (chartData["nodes"] as Array<{ id: string; name: string; category: "source" | "transformation" | "end_use" }>) ?? [];
    const links = (chartData["links"] as Array<{ source: string; target: string; value: number }>) ?? [];
    return <SankeyDiagram title={chart.title} nodes={nodes} links={links} />;
  }

  return null;
}

export default function EnterpriseReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;
  const { data: report, isLoading } = useReport(reportId);
  const { data: versions } = useReportVersions(reportId);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (isLoading) return <PageLoading />;
  if (!report) {
    return (
      <div className="p-8 text-center text-[var(--color-text-secondary)]">
        报告不存在
      </div>
    );
  }

  const currentSection = activeSection
    ? report.sections.find((s) => s.sectionCode === activeSection)
    : report.sections[0];

  const canUpload = report.status === "enterprise_revision" || report.status === "pending_final";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/enterprise/reports">
          <Button variant="ghost" size="sm">
            <ChevronLeft size={16} />
            返回
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            审计报告
          </h1>
          <div className="mt-1 flex items-center gap-3">
            <Badge variant={STATUS_VARIANTS[report.status] ?? "default"}>
              {STATUS_LABELS[report.status] ?? report.status}
            </Badge>
            <span className="text-sm text-[var(--color-text-secondary)]">
              版本 v{report.version}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Download size={16} />
            下载
          </Button>
          {canUpload && (
            <Button size="sm">
              <Upload size={16} />
              上传修订版
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Section navigation sidebar */}
        <div className="w-48 shrink-0 space-y-1">
          {report.sections.map((section) => (
            <button
              key={section.sectionCode}
              onClick={() => setActiveSection(section.sectionCode)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                (activeSection ?? report.sections[0]?.sectionCode) === section.sectionCode
                  ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium"
                  : "text-[var(--color-text-secondary)] hover:bg-gray-50"
              }`}
            >
              {section.sectionName}
            </button>
          ))}
        </div>

        {/* Section content */}
        <div className="flex-1 space-y-4">
          {currentSection && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <FileText size={18} />
                    {currentSection.sectionName}
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="whitespace-pre-wrap text-sm text-[var(--color-text)]">
                {currentSection.content ?? "暂无内容"}
              </div>

              {/* Embedded charts */}
              {currentSection.charts && currentSection.charts.length > 0 && (
                <div className="mt-6 space-y-4">
                  {currentSection.charts.map((chart) => (
                    <SectionChartRenderer
                      key={chart.chartCode}
                      chart={chart}
                      projectId={report.auditProjectId}
                    />
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Version history */}
          {versions && versions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>版本历史</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {v.versionType === "system_draft"
                          ? "系统草稿"
                          : v.versionType === "enterprise_revision"
                            ? "企业修订"
                            : "终版"}{" "}
                        v{v.versionNumber}
                      </span>
                      <span className="ml-3 text-xs text-[var(--color-text-secondary)]">
                        {new Date(v.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    {v.fileUrl && (
                      <Button variant="ghost" size="sm">
                        <Download size={14} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

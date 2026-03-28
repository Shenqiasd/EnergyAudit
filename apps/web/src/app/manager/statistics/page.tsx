"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import { EnergyPieChart } from "@/components/charts/energy-pie-chart";
import { EnergyBarChart } from "@/components/charts/energy-bar-chart";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  useBatchStatistics,
  useIndustryStatistics,
  useCarbonStatistics,
} from "@/lib/api/hooks/use-statistics";

type TabKey = "batch" | "industry" | "carbon";

const tabs: { key: TabKey; label: string }[] = [
  { key: "batch", label: "批次统计" },
  { key: "industry", label: "行业统计" },
  { key: "carbon", label: "碳排放统计" },
];

function BatchStatisticsTab() {
  const [batchId, setBatchId] = useState("");
  const { data, isLoading } = useBatchStatistics(batchId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-[var(--color-text)]">
          选择批次:
        </label>
        <input
          type="text"
          placeholder="输入批次 ID"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
        />
      </div>

      {!batchId && (
        <Card>
          <div className="flex h-48 items-center justify-center text-sm text-[var(--color-text-secondary)]">
            请输入批次 ID 查看统计数据
          </div>
        </Card>
      )}

      {batchId && isLoading && <Loading />}

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <div className="text-sm text-[var(--color-text-secondary)]">完成率</div>
              <div className="mt-2 text-3xl font-bold text-[var(--color-primary)]">
                {(data.completionRate * 100).toFixed(1)}%
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                {data.completedProjects}/{data.totalProjects} 个项目
              </div>
            </Card>
            <Card>
              <div className="text-sm text-[var(--color-text-secondary)]">超期率</div>
              <div className="mt-2 text-3xl font-bold text-[var(--color-danger)]">
                {(data.overdueRate * 100).toFixed(1)}%
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                {data.overdueProjects} 个超期项目
              </div>
            </Card>
            <Card>
              <div className="text-sm text-[var(--color-text-secondary)]">平均审核评分</div>
              <div className="mt-2 text-3xl font-bold text-[var(--color-text)]">
                {data.averageReviewScore !== null
                  ? data.averageReviewScore.toFixed(1)
                  : "N/A"}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-[var(--color-text-secondary)]">总项目数</div>
              <div className="mt-2 text-3xl font-bold text-[var(--color-text)]">
                {data.totalProjects}
              </div>
            </Card>
          </div>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>状态分布</CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-3">
              {data.statusDistribution.map((item) => (
                <Badge key={item.status} variant="primary">
                  {item.status}: {item.count}
                </Badge>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function IndustryStatisticsTab() {
  const { data, isLoading } = useIndustryStatistics();

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <EnergyPieChart
          title="行业企业分布"
          data={
            data?.distribution.map((d) => ({
              label: d.industryCode,
              value: d.enterpriseCount,
            })) ?? []
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>行业达标率</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>行业代码</TableHead>
                <TableHead>企业数</TableHead>
                <TableHead>达标数</TableHead>
                <TableHead>达标率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.compliance.length ? (
                data.compliance.map((item) => (
                  <TableRow key={item.industryCode}>
                    <TableCell>{item.industryCode}</TableCell>
                    <TableCell>{item.totalEnterprises}</TableCell>
                    <TableCell>{item.compliantEnterprises}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.complianceRate >= 0.8 ? "success" : item.complianceRate >= 0.5 ? "warning" : "danger"
                        }
                      >
                        {(item.complianceRate * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="py-4 text-center text-sm text-[var(--color-text-secondary)]">
                      暂无数据
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

function CarbonStatisticsTab() {
  const { data, isLoading } = useCarbonStatistics();

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <Card>
        <div className="text-sm text-[var(--color-text-secondary)]">碳排放总量</div>
        <div className="mt-2 text-3xl font-bold text-[var(--color-text)]">
          {data?.totalEmissions.toFixed(2) ?? "0"}{" "}
          <span className="text-sm font-normal text-[var(--color-text-secondary)]">
            tCO₂e
          </span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <EnergyPieChart
          title="能源类型碳排放分布"
          data={
            data?.byEnergyType.map((d) => ({
              label: d.energyType,
              value: d.emissions,
            })) ?? []
          }
        />

        <EnergyBarChart
          title="碳排放趋势"
          data={
            data?.trends.map((d) => ({
              label: String(d.year),
              value: d.totalEmissions,
            })) ?? []
          }
          xAxis="年份"
          yAxis="tCO₂e"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>企业碳排放排名</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>排名</TableHead>
              <TableHead>企业名称</TableHead>
              <TableHead>碳排放量 (tCO₂e)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.byEnterprise.length ? (
              data.byEnterprise.map((item, index) => (
                <TableRow key={item.enterpriseId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.enterpriseName}</TableCell>
                  <TableCell>{item.emissions.toFixed(2)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3}>
                  <div className="py-4 text-center text-sm text-[var(--color-text-secondary)]">
                    暂无数据
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default function ManagerStatisticsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("batch");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">统计分析</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          审计工作数据统计、趋势分析和报表导出
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg border border-[var(--color-border)] bg-gray-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-[var(--color-primary)] shadow-sm"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "batch" && <BatchStatisticsTab />}
      {activeTab === "industry" && <IndustryStatisticsTab />}
      {activeTab === "carbon" && <CarbonStatisticsTab />}
    </div>
  );
}

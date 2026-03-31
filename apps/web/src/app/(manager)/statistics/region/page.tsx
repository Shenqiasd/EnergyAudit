"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
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
import { Button } from "@/components/ui/button";
import { RegionDistributionChart } from "@/components/charts/region-distribution-chart";
import { EnergyBarChart } from "@/components/charts/energy-bar-chart";
import {
  useRegionDistribution,
  useRegionEnergyRanking,
  useRegionComplianceRate,
  useProvinceBreakdown,
} from "@/lib/api/hooks/use-statistics";
import { useAuditBatches } from "@/lib/api/hooks/use-audit-batches";
import { MapPin, BarChart3, ArrowLeft } from "lucide-react";

export default function RegionStatisticsPage() {
  const [selectedBatchId, setSelectedBatchId] = useState<string | undefined>(undefined);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const { data: batches } = useAuditBatches();
  const { data: distribution, isLoading: distLoading } =
    useRegionDistribution(selectedBatchId);
  const { data: ranking, isLoading: rankLoading } =
    useRegionEnergyRanking(selectedBatchId);
  const { data: compliance, isLoading: compLoading } =
    useRegionComplianceRate(selectedBatchId);
  const { data: provinceData, isLoading: provLoading } =
    useProvinceBreakdown(selectedRegion ?? "", selectedBatchId);

  const isLoading = distLoading || rankLoading || compLoading;

  if (isLoading) {
    return <Loading size={32} text="加载区域统计..." className="min-h-[400px]" />;
  }

  const batchOptions = [
    { value: "", label: "全部批次" },
    ...(batches?.items?.map((b: { id: string; name: string }) => ({
      value: b.id,
      label: b.name,
    })) ?? []),
  ];

  // Province drill-down view
  if (selectedRegion) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedRegion(null)}>
            <ArrowLeft size={16} />
            返回区域总览
          </Button>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
            {selectedRegion} - 省市明细
          </h1>
        </div>

        {provLoading ? (
          <Loading size={32} text="加载省市数据..." className="min-h-[200px]" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>省市分布</CardTitle>
            </CardHeader>
            {provinceData && provinceData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>省份</TableHead>
                    <TableHead>城市</TableHead>
                    <TableHead>企业数量</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {provinceData.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell>{p.province}</TableCell>
                      <TableCell>{p.city ?? "-"}</TableCell>
                      <TableCell className="font-mono">{p.enterpriseCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                暂无省市数据
              </p>
            )}
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">区域统计</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          按区域查看企业分布、能耗排名和合规率
        </p>
      </div>

      <div className="flex items-center gap-3">
        <MapPin size={16} className="text-[hsl(var(--muted-foreground))]" />
        <Select
          options={batchOptions}
          value={selectedBatchId ?? ""}
          onChange={(e) =>
            setSelectedBatchId(e.target.value || undefined)
          }
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Region distribution chart */}
        {distribution && (
          <RegionDistributionChart
            title="区域企业分布"
            data={distribution.map((d) => ({
              regionCode: d.regionCode,
              regionName: d.regionName,
              enterpriseCount: d.enterpriseCount,
              totalEnergyConsumption: d.totalEnergyConsumption,
            }))}
            onClick={(regionCode) => setSelectedRegion(regionCode)}
          />
        )}

        {/* Region energy ranking */}
        {ranking && (
          <EnergyBarChart
            title="区域能耗排名"
            data={ranking.map((r) => ({
              label: r.regionName,
              value: r.enterpriseCount,
            }))}
            xAxis="区域"
            yAxis="企业数量"
          />
        )}
      </div>

      {/* Region distribution table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-[hsl(var(--primary))]" />
            <CardTitle>区域分布明细</CardTitle>
          </div>
        </CardHeader>
        {distribution && distribution.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>区域</TableHead>
                <TableHead>企业数量</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distribution.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{d.regionName}</TableCell>
                  <TableCell className="font-mono">{d.enterpriseCount}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRegion(d.regionCode)}
                    >
                      查看明细
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
            暂无区域数据，请确保企业已配置区域信息
          </p>
        )}
      </Card>

      {/* Compliance rate by region */}
      <Card>
        <CardHeader>
          <CardTitle>区域合规率</CardTitle>
        </CardHeader>
        {compliance && compliance.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>区域</TableHead>
                <TableHead>项目总数</TableHead>
                <TableHead>已完成</TableHead>
                <TableHead>合规率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compliance.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{c.regionName}</TableCell>
                  <TableCell className="font-mono">{c.totalProjects}</TableCell>
                  <TableCell className="font-mono">{c.completedProjects}</TableCell>
                  <TableCell>
                    <Badge
                      variant={c.complianceRate >= 0.8 ? "success" : c.complianceRate >= 0.5 ? "warning" : "danger"}
                    >
                      {(c.complianceRate * 100).toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
            暂无合规率数据
          </p>
        )}
      </Card>
    </div>
  );
}

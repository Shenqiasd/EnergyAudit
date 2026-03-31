"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { BenchmarkBarChart } from "@/components/charts/benchmark-bar-chart";
import { useBenchmarks } from "@/lib/api/hooks/use-benchmarks";
import { useRankings } from "@/lib/api/hooks/use-statistics";
import { Filter, TrendingUp, Award } from "lucide-react";

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: `${currentYear - i}年`,
}));

export default function BenchmarkAnalysisPage() {
  const [industryCode, setIndustryCode] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  const { data: benchmarks, isLoading: benchmarksLoading } = useBenchmarks({
    industryCode: industryCode || undefined,
    applicableYear: selectedYear,
  });

  const { data: rankings, isLoading: rankingsLoading } = useRankings();

  const isLoading = benchmarksLoading || rankingsLoading;

  if (isLoading) {
    return <Loading size={32} text="加载对标分析..." className="min-h-[400px]" />;
  }

  // Group benchmarks by industry
  const industryGroups = new Map<string, typeof benchmarks>();
  if (benchmarks) {
    for (const b of benchmarks) {
      const existing = industryGroups.get(b.industryCode) ?? [];
      existing.push(b);
      industryGroups.set(b.industryCode, existing);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">能效对标分析</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          行业能效对标总览，企业能效排名
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Filter size={16} className="text-[hsl(var(--muted-foreground))]" />
        <Input
          placeholder="行业代码筛选"
          value={industryCode}
          onChange={(e) => setIndustryCode(e.target.value)}
          className="w-40"
        />
        <Select
          options={[{ value: "", label: "全部年份" }, ...yearOptions]}
          value={selectedYear ? String(selectedYear) : ""}
          onChange={(e) =>
            setSelectedYear(
              e.target.value ? parseInt(e.target.value, 10) : undefined,
            )
          }
        />
      </div>

      {/* Industry benchmark overview */}
      {Array.from(industryGroups.entries()).map(([code, items]) => (
        <Card key={code}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-[hsl(var(--primary))]" />
              <CardTitle>行业 {code} 对标值</CardTitle>
            </div>
          </CardHeader>
          {items && items.length > 0 && (
            <BenchmarkBarChart
              title=""
              data={items.map((b) => ({
                indicatorName: b.indicatorName,
                actualValue: 0,
                benchmarkValue: Number(b.benchmarkValue),
                unit: b.unit ?? "",
                status: "equal" as const,
              }))}
            />
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>指标名称</TableHead>
                <TableHead>对标值</TableHead>
                <TableHead>单位</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>适用年份</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.indicatorName}</TableCell>
                  <TableCell className="font-mono">{b.benchmarkValue}</TableCell>
                  <TableCell>{b.unit ?? "-"}</TableCell>
                  <TableCell className="text-xs">{b.source ?? "-"}</TableCell>
                  <TableCell>{b.applicableYear ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ))}

      {industryGroups.size === 0 && (
        <Card>
          <div className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
            暂无对标数据
          </div>
        </Card>
      )}

      {/* Enterprise ranking */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award size={18} className="text-[hsl(var(--primary))]" />
            <CardTitle>企业能效排名</CardTitle>
          </div>
        </CardHeader>
        {rankings && rankings.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>排名</TableHead>
                <TableHead>企业名称</TableHead>
                <TableHead>平均评分</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.map((r) => (
                <TableRow key={r.enterpriseId}>
                  <TableCell>
                    <Badge
                      variant={r.rank <= 3 ? "primary" : "default"}
                    >
                      #{r.rank}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{r.enterpriseName}</TableCell>
                  <TableCell className="font-mono">
                    {r.averageScore.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
            暂无排名数据
          </p>
        )}
      </Card>
    </div>
  );
}

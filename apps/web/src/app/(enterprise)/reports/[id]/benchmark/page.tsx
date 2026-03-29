"use client";

import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useBenchmarkComparison } from "@/lib/api/hooks/use-benchmarks";
import { useAuth } from "@/lib/auth/use-auth";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export default function EnterpriseBenchmarkPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useAuth();
  const enterpriseId = user?.enterpriseId ?? "";

  const { data: comparisons, isLoading } = useBenchmarkComparison(
    enterpriseId,
    projectId,
  );

  if (isLoading) {
    return <Loading size={32} text="加载对标分析..." className="min-h-[400px]" />;
  }

  const statusConfig = {
    above: { label: "高于对标", color: "danger" as const, icon: ArrowUp },
    below: { label: "优于对标", color: "success" as const, icon: ArrowDown },
    equal: { label: "持平", color: "default" as const, icon: Minus },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">能效对标分析</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          将企业实际能效指标与行业对标值进行对比分析
        </p>
      </div>

      {comparisons && comparisons.length > 0 ? (
        <>
          <BenchmarkBarChart
            title="对标对比图"
            data={comparisons.map((c) => ({
              indicatorName: c.indicatorName,
              actualValue: c.actualValue,
              benchmarkValue: c.benchmarkValue,
              unit: c.unit,
              status: c.status,
            }))}
          />

          <Card>
            <CardHeader>
              <CardTitle>差距分析</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>指标名称</TableHead>
                  <TableHead>实际值</TableHead>
                  <TableHead>对标值</TableHead>
                  <TableHead>单位</TableHead>
                  <TableHead>差距</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisons.map((c, i) => {
                  const config = statusConfig[c.status];
                  const Icon = config.icon;
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.indicatorName}</TableCell>
                      <TableCell className="font-mono">{c.actualValue.toFixed(2)}</TableCell>
                      <TableCell className="font-mono">{c.benchmarkValue.toFixed(2)}</TableCell>
                      <TableCell>{c.unit}</TableCell>
                      <TableCell className="font-mono">
                        {c.gapPercent > 0 ? "+" : ""}
                        {c.gapPercent.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.color}>
                          <Icon size={12} className="mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      ) : (
        <Card>
          <div className="py-12 text-center">
            <p className="text-[var(--color-text-secondary)]">
              暂无对标数据，请联系管理员配置行业对标值
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

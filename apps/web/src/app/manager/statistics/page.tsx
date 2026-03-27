import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function ManagerStatisticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">统计分析</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          审计工作数据统计、趋势分析和报表导出
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <BarChart3 size={20} />
              功能建设中
            </span>
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--color-text-secondary)]">
          统计分析页面将包括：审计项目统计、企业能耗数据分析、审核通过率趋势、整改完成率统计、数据报表导出等功能模块。
        </p>
      </Card>
    </div>
  );
}

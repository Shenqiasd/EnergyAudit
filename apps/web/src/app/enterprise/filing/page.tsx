import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";

export default function EnterpriseFilingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">数据填报</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          填写审计所需的能源消耗数据、生产数据等
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Database size={20} />
              功能建设中
            </span>
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--color-text-secondary)]">
          数据填报页面将包括：动态表单填报、数据校验、暂存与提交、导入导出、填报进度跟踪等功能模块。
        </p>
      </Card>
    </div>
  );
}

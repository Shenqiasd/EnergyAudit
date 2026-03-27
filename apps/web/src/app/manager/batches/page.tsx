import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";

export default function ManagerBatchesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">批次管理</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          创建和管理审计批次，分配企业到批次
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Layers size={20} />
              功能建设中
            </span>
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--color-text-secondary)]">
          批次管理页面将包括：批次列表、创建批次、批次详情、企业分配、批次状态管理等功能模块。
        </p>
      </Card>
    </div>
  );
}

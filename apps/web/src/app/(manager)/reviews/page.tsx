import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function ManagerReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">审核管理</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          管理审核任务分配、审核进度监控和整改督办
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Shield size={20} />
              功能建设中
            </span>
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--color-text-secondary)]">
          审核管理页面将包括：审核任务列表、审核员分配、审核进度跟踪、整改督办、审核结果确认等功能模块。
        </p>
      </Card>
    </div>
  );
}

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

export default function ManagerProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">项目管理</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          管理审计项目的全生命周期，跟踪项目进度
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <ClipboardCheck size={20} />
              功能建设中
            </span>
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--color-text-secondary)]">
          项目管理页面将包括：项目列表、项目详情、模板分配、成员管理、项目状态流转、填报进度监控等功能模块。
        </p>
      </Card>
    </div>
  );
}

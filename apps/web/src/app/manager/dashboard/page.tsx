import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";

export default function ManagerDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">工作台</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          管理端工作台 — 审计工作总览、项目进度、审核状态统计
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "在审项目", value: "0" },
          { label: "待审核", value: "0" },
          { label: "待整改", value: "0" },
          { label: "已完成", value: "0" },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {stat.label}
            </div>
            <div className="mt-2 text-3xl font-bold text-[var(--color-primary)]">
              {stat.value}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Home size={20} />
              功能建设中
            </span>
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--color-text-secondary)]">
          管理端工作台将展示：审计工作总览、项目进度统计图表、待办事项、最近操作记录等内容。
        </p>
      </Card>
    </div>
  );
}

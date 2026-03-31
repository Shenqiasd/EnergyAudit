import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

export default function EnterpriseDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">工作台</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          企业端工作台 — 查看审计进度、待办事项和数据概览
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "待填报项目", value: "0" },
          { label: "审核中", value: "0" },
          { label: "整改任务", value: "0" },
          { label: "已完成", value: "0" },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              {stat.label}
            </div>
            <div className="mt-2 text-3xl font-bold text-[hsl(var(--primary))]">
              {stat.value}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <LayoutDashboard size={20} />
              功能建设中
            </span>
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          企业端工作台将展示：审计项目进度概览、待办事项列表、最近填报记录、整改任务提醒等内容。
        </p>
      </Card>
    </div>
  );
}

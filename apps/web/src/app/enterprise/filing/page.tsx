"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { ListPageSkeleton } from "@/components/skeleton/list-skeleton";
import { useDataModules } from "@/lib/api/hooks/use-data-entry";
import { clsx } from "clsx";
import {
  BarChart3,
  Battery,
  Building2,
  ClipboardList,
  Database,
  Droplets,
  Factory,
  FileText,
  Flame,
  Gauge,
  Leaf,
  Settings,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo, type ElementType } from "react";

const moduleIcons: Record<string, ElementType> = {
  "enterprise-profile": Building2,
  "business-indicators": BarChart3,
  "equipment-management": Settings,
  "energy-efficiency": Gauge,
  "energy-consumption": Zap,
  "energy-balance": BarChart3,
  "product-energy": Factory,
  "carbon-emission": Leaf,
  "energy-saving-measures": ClipboardList,
  "energy-flow": BarChart3,
  "water-consumption": Droplets,
  "steam-consumption": Flame,
  "electricity-detail": Zap,
  "fuel-detail": Flame,
  "heat-consumption": Flame,
  "renewable-energy": Leaf,
  "energy-storage": Battery,
  "cogeneration": Factory,
  "major-equipment": Settings,
  "metering-config": Gauge,
  "energy-management": ClipboardList,
  "energy-audit-history": FileText,
  "rectification-plan": ClipboardList,
  "appendix-data": FileText,
};

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "primary" | "success" | "warning" | "danger"; progress: number }
> = {
  not_started: { label: "未开始", variant: "default", progress: 0 },
  draft: { label: "草稿", variant: "default", progress: 20 },
  saved: { label: "已保存", variant: "primary", progress: 50 },
  validation_failed: { label: "校验失败", variant: "danger", progress: 60 },
  ready_to_submit: { label: "待提交", variant: "warning", progress: 80 },
  submitted: { label: "已提交", variant: "success", progress: 100 },
  returned: { label: "已退回", variant: "danger", progress: 40 },
  archived: { label: "已归档", variant: "default", progress: 100 },
};

export default function EnterpriseFilingPage() {
  // TODO: get projectId from context/route
  const { data: modules, isLoading } = useDataModules();

  const grouped = useMemo(() => {
    if (!modules) return {};
    const groups: Record<string, typeof modules> = {};
    for (const mod of modules) {
      if (!groups[mod.category]) groups[mod.category] = [];
      groups[mod.category].push(mod);
    }
    return groups;
  }, [modules]);

  if (isLoading) return <ListPageSkeleton rows={6} />;

  const categories = Object.keys(grouped);

  return (
    <div className="space-y-6">
      {/* PageHeader */}
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
          数据填报
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          填写审计所需的能源消耗数据、生产数据等，共 {modules?.length ?? 0} 个填报模块
        </p>
      </div>

      {/* Module cards grid */}
      {categories.map((category) => (
        <div key={category}>
          <h2 className="mb-3 text-lg font-semibold text-[hsl(var(--foreground))]">
            {category}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {grouped[category].map((mod) => {
              const Icon = moduleIcons[mod.code] ?? Database;
              const status = statusConfig[mod.recordStatus ?? "not_started"] ?? statusConfig.not_started;

              return (
                <Link
                  key={mod.code}
                  href={`/enterprise/filing/${mod.code}`}
                >
                  <Card
                    className={clsx(
                      "cursor-pointer transition-shadow hover:shadow-md",
                      mod.recordStatus === "submitted" && "border-[hsl(var(--success))]",
                    )}
                  >
                    <CardHeader className="mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10">
                          <Icon size={18} className="text-[hsl(var(--primary))]" />
                        </div>
                        <CardTitle className="text-sm">{mod.name}</CardTitle>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </CardHeader>

                    {/* Progress bar */}
                    <div className="mb-2 space-y-1">
                      <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                        <span>填报进度</span>
                        <span>{status.progress}%</span>
                      </div>
                      <Progress value={status.progress} className="h-1.5" />
                    </div>

                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {mod.description ?? `${mod.name}数据填报`}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {categories.length === 0 && !isLoading && (
        <EmptyState
          icon={<Database className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />}
          title="暂无填报模块"
          description="等待项目配置填报模块"
        />
      )}
    </div>
  );
}

"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { useConfigCompleteness } from "@/lib/api/hooks/use-master-data";
import { useAuth } from "@/lib/auth/use-auth";
import { AlertTriangle, CheckCircle, Flame, Package, Layers } from "lucide-react";
import Link from "next/link";

export default function EnterpriseConfigPage() {
  const { user } = useAuth();
  const enterpriseId = user?.id ?? "";
  const { data: completeness, isLoading } = useConfigCompleteness(enterpriseId);

  if (isLoading) {
    return <Loading size={32} text="加载配置信息..." className="min-h-[400px]" />;
  }

  const totalItems =
    (completeness?.energyDefinitions.count ?? 0) +
    (completeness?.productDefinitions.count ?? 0) +
    (completeness?.unitDefinitions.count ?? 0);

  const completedSections = [
    completeness?.energyDefinitions.complete,
    completeness?.productDefinitions.complete,
    completeness?.unitDefinitions.complete,
  ].filter(Boolean).length;

  const progressPercent = Math.round((completedSections / 3) * 100);

  const sections = [
    {
      title: "能源品种定义",
      description: "配置企业使用的能源品种，包括一次能源和二次能源",
      icon: Flame,
      count: completeness?.energyDefinitions.count ?? 0,
      required: completeness?.energyDefinitions.required ?? 1,
      complete: completeness?.energyDefinitions.complete ?? false,
      href: "/enterprise/config/energy",
    },
    {
      title: "产品定义",
      description: "配置企业生产的产品类型及其计量单位",
      icon: Package,
      count: completeness?.productDefinitions.count ?? 0,
      required: completeness?.productDefinitions.required ?? 1,
      complete: completeness?.productDefinitions.complete ?? false,
      href: "/enterprise/config/products",
    },
    {
      title: "单元定义",
      description: "配置企业的用能单元及能源消耗边界",
      icon: Layers,
      count: completeness?.unitDefinitions.count ?? 0,
      required: completeness?.unitDefinitions.required ?? 1,
      complete: completeness?.unitDefinitions.complete ?? false,
      href: "/enterprise/config/units",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">配置中心</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          管理企业能源审计所需的基础数据配置
        </p>
      </div>

      {completeness && !completeness.isComplete && (
        <div className="flex items-start gap-3 rounded-xl border border-[hsl(var(--warning))] bg-[hsl(var(--warning))/10] p-4">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-[hsl(var(--warning))]" />
          <div>
            <p className="font-medium text-[hsl(var(--foreground))]">配置未完成</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              请完成以下配置后方可进行申报：
            </p>
            <ul className="mt-2 space-y-1">
              {completeness.missingItems.map((item, i) => (
                <li key={i} className="text-sm text-[hsl(var(--muted-foreground))]">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>配置完成度</CardTitle>
          <Badge variant={completeness?.isComplete ? "success" : "warning"}>
            {completeness?.isComplete ? "已完成" : "未完成"}
          </Badge>
        </CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">
              已配置 {totalItems} 项，{completedSections}/3 个必要分类已完成
            </span>
            <span className="font-medium text-[hsl(var(--foreground))]">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.title} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <section.icon size={20} className="text-[hsl(var(--primary))]" />
                <CardTitle>{section.title}</CardTitle>
              </div>
              {section.complete ? (
                <CheckCircle size={18} className="text-[hsl(var(--success))]" />
              ) : (
                <AlertTriangle size={18} className="text-[hsl(var(--warning))]" />
              )}
            </CardHeader>
            <p className="mb-4 flex-1 text-sm text-[hsl(var(--muted-foreground))]">
              {section.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                已配置 <span className="font-medium text-[hsl(var(--foreground))]">{section.count}</span> 项
                （至少需要 {section.required} 项）
              </span>
              <Link href={section.href}>
                <Button size="sm" variant={section.complete ? "secondary" : "primary"}>
                  {section.complete ? "查看" : "去配置"}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

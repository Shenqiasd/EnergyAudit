"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

const ledgerTabs = [
  { label: "企业台账", href: "/manager/ledgers/enterprise" },
  { label: "审核台账", href: "/manager/ledgers/review" },
  { label: "整改台账", href: "/manager/ledgers/rectification" },
];

export default function LedgersPage() {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <PageHeader
        title="台账管理"
        description="企业台账、审核台账、整改台账查询与导出"
      />

      <div className="flex gap-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-1">
        {ledgerTabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--primary))] shadow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="flex h-48 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm text-[hsl(var(--muted-foreground))]">
        请选择上方台账类型查看详情
      </div>
    </div>
  );
}

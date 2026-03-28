"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const ledgerTabs = [
  { label: "企业台账", href: "/manager/ledgers/enterprise" },
  { label: "审核台账", href: "/manager/ledgers/review" },
  { label: "整改台账", href: "/manager/ledgers/rectification" },
];

export default function LedgersPage() {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">台账管理</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          企业台账、审核台账、整改台账查询与导出
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border border-[var(--color-border)] bg-gray-50 p-1">
        {ledgerTabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-[var(--color-primary)] shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="flex h-48 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white text-sm text-[var(--color-text-secondary)]">
        请选择上方台账类型查看详情
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[hsl(var(--border))] pb-6">
      <div className="space-y-1.5">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-3 flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={12} className="opacity-50" />}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-[hsl(var(--primary))]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-[hsl(var(--foreground))]">
                    {item.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

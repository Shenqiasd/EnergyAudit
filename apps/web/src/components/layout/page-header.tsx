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
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-2.5 flex items-center gap-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={12} className="opacity-40" />}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-[hsl(var(--foreground))]"
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
        <h1 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DetailHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  metadata?: { label: string; value: React.ReactNode }[];
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function DetailHeader({
  icon,
  title,
  subtitle,
  badges,
  metadata,
  actions,
  backHref,
  backLabel = "返回列表",
  className,
}: DetailHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {backHref && (
        <div className="flex items-center gap-2">
          <Link href={backHref}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
              {backLabel}
            </Button>
          </Link>
        </div>
      )}

      <Card className="p-0">
        <div className="flex items-start justify-between gap-4 p-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-[hsl(var(--foreground))] sm:text-2xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {badges && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {badges}
              </div>
            )}

            {metadata && metadata.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1">
                {metadata.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <span className="text-[hsl(var(--muted-foreground))]">
                      {item.label}:
                    </span>
                    <span className="text-[hsl(var(--foreground))]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      </Card>
    </div>
  );
}

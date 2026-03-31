import { cn } from "@/lib/utils";

interface TimelineItem {
  id: string;
  avatar?: React.ReactNode;
  title: string;
  description?: string;
  timestamp: string;
  type?: "default" | "success" | "warning" | "danger";
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const dotColors: Record<string, string> = {
  default: "bg-[hsl(var(--muted-foreground))]",
  success: "bg-[hsl(var(--success))]",
  warning: "bg-[hsl(var(--warning))]",
  danger: "bg-[hsl(var(--danger))]",
};

export function Timeline({ items, className }: TimelineProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[hsl(var(--muted-foreground))]">暂无记录</p>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const dotColor = dotColors[item.type ?? "default"];

        return (
          <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[9px] top-6 h-[calc(100%-12px)] w-0.5 bg-[hsl(var(--border))]" />
            )}

            {/* Dot or avatar */}
            <div className="relative z-10 flex shrink-0 items-start pt-0.5">
              {item.avatar ? (
                <div className="flex h-5 w-5 items-center justify-center">
                  {item.avatar}
                </div>
              ) : (
                <div
                  className={cn(
                    "mt-1 h-[10px] w-[10px] rounded-full ring-2 ring-[hsl(var(--background))]",
                    dotColor
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                {item.title}
              </p>
              {item.description && (
                <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
                  {item.description}
                </p>
              )}
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                {item.timestamp}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type { TimelineItem, TimelineProps };

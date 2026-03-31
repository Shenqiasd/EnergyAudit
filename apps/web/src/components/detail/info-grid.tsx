import { cn } from "@/lib/utils";

interface InfoGridProps {
  items: {
    label: string;
    value: React.ReactNode;
    span?: number;
  }[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const columnClasses: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const spanClasses: Record<number, string> = {
  1: "col-span-1",
  2: "sm:col-span-2",
  3: "sm:col-span-2 lg:col-span-3",
  4: "sm:col-span-2 lg:col-span-4",
};

export function InfoGrid({ items, columns = 2, className }: InfoGridProps) {
  return (
    <div className={cn("grid gap-4", columnClasses[columns], className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn("space-y-1", item.span ? spanClasses[item.span] : undefined)}
        >
          <dt className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {item.label}
          </dt>
          <dd className="text-sm text-[hsl(var(--foreground))]">
            {item.value ?? "-"}
          </dd>
        </div>
      ))}
    </div>
  );
}

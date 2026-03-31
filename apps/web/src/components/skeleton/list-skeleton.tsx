import { Skeleton } from "@/components/ui/skeleton";

export function ListPageSkeleton({
  rows = 5,
  showFilterSkeleton = true,
}: {
  rows?: number;
  showFilterSkeleton?: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* FilterBar skeleton */}
      {showFilterSkeleton && (
        <div className="flex gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}
      {/* Table skeleton */}
      <div className="rounded-xl border border-[hsl(var(--border))]">
        <div className="flex gap-4 p-4 border-b border-[hsl(var(--border))]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={`row-${i}`}
            className="flex gap-4 p-4 border-b border-[hsl(var(--border))] last:border-0"
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={`cell-${i}-${j}`} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

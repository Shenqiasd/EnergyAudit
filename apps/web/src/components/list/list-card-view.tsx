"use client";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { ReactNode } from "react";

interface ListCardViewProps<TData> {
  data: TData[];
  renderCard: (item: TData, index: number) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
}

export function ListCardView<TData>({
  data,
  renderCard,
  emptyTitle = "暂无数据",
  emptyDescription,
  emptyAction,
  className,
}: ListCardViewProps<TData>) {
  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {data.map((item, index) => renderCard(item, index))}
    </div>
  );
}

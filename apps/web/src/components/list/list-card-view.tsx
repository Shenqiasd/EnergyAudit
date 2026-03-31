"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/ui/empty-state";
import type { ReactNode } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

interface ListCardViewProps<TData> {
  data: TData[];
  renderCard: (item: TData, index: number) => ReactNode;
  keyExtractor?: (item: TData, index: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
}

export function ListCardView<TData>({
  data,
  renderCard,
  keyExtractor,
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {data.map((item, index) => (
        <motion.div key={keyExtractor ? keyExtractor(item, index) : index} variants={cardVariants}>
          {renderCard(item, index)}
        </motion.div>
      ))}
    </motion.div>
  );
}

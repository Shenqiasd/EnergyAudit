"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ChartContainer({ title, children, className }: ChartContainerProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <div className="px-2 pb-4">{children}</div>
    </Card>
  );
}

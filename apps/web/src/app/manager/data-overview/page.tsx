"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { Progress } from "@/components/ui/progress";
import { Table } from "@/components/ui/table";
import { useDataModules } from "@/lib/api/hooks/use-data-entry";
import {
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Layers,
} from "lucide-react";
import { useMemo } from "react";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "primary" | "success" | "warning" | "danger";
    progress: number;
  }
> = {
  not_started: { label: "\u672a\u5f00\u59cb", variant: "default", progress: 0 },
  draft: { label: "\u8349\u7a3f", variant: "default", progress: 20 },
  saved: { label: "\u5df2\u4fdd\u5b58", variant: "primary", progress: 50 },
  validation_failed: { label: "\u6821\u9a8c\u5931\u8d25", variant: "danger", progress: 60 },
  ready_to_submit: { label: "\u5f85\u63d0\u4ea4", variant: "warning", progress: 80 },
  submitted: { label: "\u5df2\u63d0\u4ea4", variant: "success", progress: 100 },
  returned: { label: "\u5df2\u9000\u56de", variant: "danger", progress: 40 },
  archived: { label: "\u5df2\u5f52\u6863", variant: "default", progress: 100 },
};

export default function ManagerDataOverviewPage() {
  const { data: modules, isLoading } = useDataModules();

  const stats = useMemo(() => {
    if (!modules) return { total: 0, submitted: 0, inProgress: 0, notStarted: 0 };
    const submitted = modules.filter((m) => m.recordStatus === "submitted").length;
    const inProgress = modules.filter(
      (m) =>
        m.recordStatus &&
        m.recordStatus !== "not_started" &&
        m.recordStatus !== "submitted",
    ).length;
    return {
      total: modules.length,
      submitted,
      inProgress,
      notStarted: modules.length - submitted - inProgress,
    };
  }, [modules]);

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* PageHeader */}
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
          {"\u586b\u62a5\u6982\u89c8"}
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          {"\u76d1\u63a7\u6240\u6709\u4f01\u4e1a\u7684\u586b\u62a5\u8fdb\u5ea6"}
        </p>
      </div>

      {/* Summary StatCards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Layers size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{"\u603b\u6a21\u5757\u6570"}</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {stats.total}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{"\u5df2\u5b8c\u6210"}</p>
              <p className="text-2xl font-bold text-emerald-500">
                {stats.submitted}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Clock size={20} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{"\u8fdb\u884c\u4e2d"}</p>
              <p className="text-2xl font-bold text-orange-500">
                {stats.inProgress}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <FileText size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{"\u672a\u5f00\u59cb"}</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {stats.notStarted}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Module Completion Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Database size={20} />
              {"\u6a21\u5757\u586b\u62a5\u8fdb\u5ea6"}
            </span>
          </CardTitle>
        </CardHeader>
        {modules && modules.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <th className="text-left">{"\u6a21\u5757\u540d\u79f0"}</th>
                <th className="text-left">{"\u5206\u7c7b"}</th>
                <th className="text-left">{"\u586b\u62a5\u8fdb\u5ea6"}</th>
                <th className="text-left">{"\u72b6\u6001"}</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => {
                const status =
                  statusConfig[mod.recordStatus ?? "not_started"] ??
                  statusConfig.not_started;
                return (
                  <tr key={mod.code}>
                    <td className="font-medium">{mod.name}</td>
                    <td className="text-[hsl(var(--muted-foreground))]">
                      {mod.category}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Progress value={status.progress} className="h-2 w-24" />
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {status.progress}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {"\u6682\u65e0\u6a21\u5757\u6570\u636e"}
          </p>
        )}
      </Card>
    </div>
  );
}

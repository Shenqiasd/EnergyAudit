"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEnterprises } from "@/lib/api/hooks/use-enterprises";
import { useTriggerSync } from "@/lib/api/hooks/use-integration";
import type { Enterprise } from "@/lib/api/hooks/use-enterprises";

const SYNC_STATUS_MAP: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "default" }
> = {
  synced: { label: "已同步", variant: "success" },
  pending: { label: "待同步", variant: "warning" },
  failed: { label: "同步失败", variant: "danger" },
  degraded: { label: "降级模式", variant: "default" },
  processing: { label: "同步中", variant: "warning" },
  not_configured: { label: "未配置", variant: "default" },
};

function SyncStatusBadge({ status }: { status: string }) {
  const config = SYNC_STATUS_MAP[status] ?? {
    label: status,
    variant: "default" as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function ManagerSyncPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useEnterprises({ page, pageSize: 20 });

  useEffect(() => {
    const interval = setInterval(() => {
      void refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const handleBatchSync = () => {
    void refetch();
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            同步管理
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            管理企业信息同步状态，手动触发同步操作
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void refetch()}>
            <RefreshCw size={16} />
            刷新
          </Button>
          <Button onClick={handleBatchSync}>
            <Activity size={16} />
            批量同步
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Activity size={20} />
              企业同步状态
            </span>
          </CardTitle>
        </CardHeader>

        {isLoading ? (
          <PageLoading />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>企业名称</TableHead>
                  <TableHead>同步状态</TableHead>
                  <TableHead>最后同步时间</TableHead>
                  <TableHead>重试次数</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((enterprise: Enterprise) => (
                  <SyncRow key={enterprise.id} enterprise={enterprise} />
                ))}
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-[var(--color-text-secondary)]"
                    >
                      暂无企业数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  共 {data?.total} 条记录
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    上一页
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function SyncRow({ enterprise }: { enterprise: Enterprise }) {
  const syncMutation = useTriggerSync(enterprise.id);

  return (
    <TableRow>
      <TableCell className="font-medium">{enterprise.name}</TableCell>
      <TableCell>
        <SyncStatusBadge status={syncMutation.data?.status ?? "pending"} />
      </TableCell>
      <TableCell className="text-sm text-[var(--color-text-secondary)]">
        {syncMutation.data?.lastSyncedAt
          ? new Date(syncMutation.data.lastSyncedAt).toLocaleString("zh-CN")
          : "-"}
      </TableCell>
      <TableCell>{syncMutation.data?.retryCount ?? 0}</TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <RefreshCw
            size={14}
            className={syncMutation.isPending ? "animate-spin" : ""}
          />
          {syncMutation.isPending ? "同步中..." : "同步"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

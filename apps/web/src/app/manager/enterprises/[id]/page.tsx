"use client";

import { use } from "react";
import { Building2, RefreshCw, Users, Clock, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { DetailSkeleton } from "@/components/skeleton/detail-skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DetailHeader } from "@/components/detail/detail-header";
import { InfoGrid } from "@/components/detail/info-grid";
import { Timeline } from "@/components/detail/timeline";
import type { TimelineItem } from "@/components/detail/timeline";
import { useEnterprise, useSyncEnterprise, useUpdateAdmission } from "@/lib/api/hooks/use-enterprises";

const STATUS_MAP: Record<string, { label: string; variant: "warning" | "success" | "danger" | "default" }> = {
  pending_review: { label: "待审核", variant: "warning" },
  approved: { label: "已通过", variant: "success" },
  rejected: { label: "已驳回", variant: "danger" },
  suspended: { label: "已停用", variant: "default" },
  locked: { label: "已锁定", variant: "default" },
  expired: { label: "已过期", variant: "default" },
};

const SYNC_STATUS_MAP: Record<string, { label: string; color: string }> = {
  synced: { label: "已同步", color: "bg-green-500" },
  pending: { label: "待同步", color: "bg-yellow-500" },
  failed: { label: "同步失败", color: "bg-red-500" },
  degraded: { label: "降级模式", color: "bg-[hsl(var(--muted-foreground))]" },
};

function SyncStatusIndicator({ status }: { status: string }) {
  const config = SYNC_STATUS_MAP[status] ?? { label: status, color: "bg-[hsl(var(--muted-foreground))]" };
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={`h-2 w-2 rounded-full ${config.color}`} />
      {config.label}
    </span>
  );
}

export default function EnterpriseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: enterprise, isLoading } = useEnterprise(id);
  const syncMutation = useSyncEnterprise(id);
  const approveMutation = useUpdateAdmission(id, "approve");
  const rejectMutation = useUpdateAdmission(id, "reject");
  const suspendMutation = useUpdateAdmission(id, "suspend");
  const restoreMutation = useUpdateAdmission(id, "restore");

  if (isLoading) return <DetailSkeleton />;
  if (!enterprise) return <div className="p-8 text-center text-[hsl(var(--muted-foreground))]">企业不存在</div>;

  const handleAction = (action: string) => {
    const operatedBy = "system";
    const mutations: Record<string, typeof approveMutation> = {
      approve: approveMutation,
      reject: rejectMutation,
      suspend: suspendMutation,
      restore: restoreMutation,
    };
    mutations[action]?.mutate({ operatedBy });
  };

  const statusConfig = STATUS_MAP[enterprise.admissionStatus] ?? { label: enterprise.admissionStatus, variant: "default" as const };

  const actionButtons = (
    <div className="flex flex-wrap gap-2">
      {enterprise.admissionStatus === "pending_review" && (
        <>
          <Button size="sm" onClick={() => handleAction("approve")} disabled={approveMutation.isPending}>
            审核通过
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleAction("reject")} disabled={rejectMutation.isPending}>
            驳回
          </Button>
        </>
      )}
      {enterprise.admissionStatus === "approved" && (
        <Button size="sm" variant="secondary" onClick={() => handleAction("suspend")} disabled={suspendMutation.isPending}>
          停用
        </Button>
      )}
      {enterprise.admissionStatus === "suspended" && (
        <Button size="sm" onClick={() => handleAction("restore")} disabled={restoreMutation.isPending}>
          恢复
        </Button>
      )}
    </div>
  );

  const auditLogItems: TimelineItem[] = [
    {
      id: "created",
      title: "企业创建",
      description: "创建于系统",
      timestamp: new Date(enterprise.createdAt).toLocaleString("zh-CN"),
      type: "success",
    },
  ];

  return (
    <div className="space-y-6">
      <DetailHeader
        icon={<Building2 size={20} />}
        title={enterprise.name}
        subtitle={enterprise.unifiedSocialCreditCode}
        badges={<Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>}
        metadata={[
          { label: "行业", value: enterprise.industryCode ?? "-" },
          { label: "联系人", value: enterprise.contactPerson ?? "-" },
        ]}
        actions={actionButtons}
        backHref="/manager/enterprises"
        backLabel="返回列表"
      />

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="bindings">外部绑定</TabsTrigger>
          <TabsTrigger value="users">用户账户</TabsTrigger>
          <TabsTrigger value="logs">操作日志</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <InfoGrid
              columns={2}
              items={[
                { label: "企业名称", value: enterprise.name },
                { label: "统一社会信用代码", value: enterprise.unifiedSocialCreditCode },
                { label: "行业分类", value: enterprise.industryCode ?? "-" },
                { label: "联系人", value: enterprise.contactPerson ?? "-" },
                { label: "联系电话", value: enterprise.contactPhone ?? "-" },
                { label: "联系邮箱", value: enterprise.contactEmail ?? "-" },
                { label: "地址", value: enterprise.address ?? "-", span: 2 },
                { label: "备注", value: enterprise.notes ?? "-", span: 2 },
              ]}
            />
          </Card>
        </TabsContent>

        <TabsContent value="bindings">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Link2 size={18} />
                  外部绑定状态
                </span>
              </CardTitle>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                <RefreshCw size={14} className={syncMutation.isPending ? "animate-spin" : ""} />
                手动同步
              </Button>
            </CardHeader>
            {enterprise.bindings.length > 0 ? (
              <div className="space-y-3">
                {enterprise.bindings.map((binding) => (
                  <div key={binding.id} className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3">
                    <div>
                      <p className="text-sm font-medium">{binding.externalSystem}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        外部ID: {binding.externalId}
                      </p>
                    </div>
                    <SyncStatusIndicator status={binding.syncStatus} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">暂未绑定外部系统</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Users size={18} />
                  关联用户
                </span>
              </CardTitle>
            </CardHeader>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              <a href={`/manager/users?enterpriseId=${enterprise.id}`} className="text-[hsl(var(--primary))] hover:underline">
                查看关联用户 →
              </a>
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Clock size={18} />
                  操作日志
                </span>
              </CardTitle>
            </CardHeader>
            <Timeline items={auditLogItems} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

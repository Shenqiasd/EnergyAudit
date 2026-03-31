"use client";

import { use } from "react";
import { ArrowLeft, Building2, RefreshCw, Users, Clock, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
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
  degraded: { label: "降级模式", color: "bg-gray-500" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function SyncStatusIndicator({ status }: { status: string }) {
  const config = SYNC_STATUS_MAP[status] ?? { label: status, color: "bg-gray-400" };
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

  if (isLoading) return <PageLoading />;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/manager/enterprises">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} />
            返回列表
          </Button>
        </a>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">{enterprise.name}</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {enterprise.unifiedSocialCreditCode}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Building2 size={18} />
                基本信息
              </span>
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <InfoRow label="企业名称" value={enterprise.name} />
            <InfoRow label="统一社会信用代码" value={enterprise.unifiedSocialCreditCode} />
            <InfoRow label="行业分类" value={enterprise.industryCode ?? "-"} />
            <InfoRow label="联系人" value={enterprise.contactPerson ?? "-"} />
            <InfoRow label="联系电话" value={enterprise.contactPhone ?? "-"} />
            <InfoRow label="联系邮箱" value={enterprise.contactEmail ?? "-"} />
            <InfoRow label="地址" value={enterprise.address ?? "-"} />
            <InfoRow label="备注" value={enterprise.notes ?? "-"} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Clock size={18} />
                  准入状态
                </span>
              </CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">当前状态：</span>
                <StatusBadge status={enterprise.admissionStatus} />
              </div>
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
            </div>
          </Card>

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
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-32 shrink-0 text-sm text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="text-sm text-[hsl(var(--foreground))]">{value}</span>
    </div>
  );
}

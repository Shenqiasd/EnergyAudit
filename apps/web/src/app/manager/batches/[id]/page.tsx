"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { ArrowLeft, Building2, CheckCircle, Clock, FileText, Users } from "lucide-react";
import { useAuditBatch, useAssignEnterprises, useExtendBatchDeadline } from "@/lib/api/hooks/use-audit-batches";
import { DeadlineExtensionDialog } from "@/components/deadline-extension-dialog";
import { useEnterprises } from "@/lib/api/hooks/use-enterprises";
import { useAuditProjects } from "@/lib/api/hooks/use-audit-projects";

const STATUS_LABELS: Record<string, string> = {
  pending_start: "待启动",
  configuring: "配置中",
  filing: "填报中",
  pending_submit: "待提交",
  pending_report: "待生成报告",
  report_processing: "报告处理中",
  pending_review: "待审核",
  in_review: "审核中",
  pending_rectification: "待整改",
  in_rectification: "整改中",
  completed: "已完成",
  closed: "已关闭",
};

const statCards = [
  { key: "pending_start", label: "待启动", icon: Clock, color: "text-gray-500" },
  { key: "filing", label: "填报中", icon: FileText, color: "text-blue-500" },
  { key: "pending_review", label: "待审核", icon: Users, color: "text-orange-500" },
  { key: "completed", label: "已完成", icon: CheckCircle, color: "text-green-500" },
];

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;

  const { data: batch, isLoading: batchLoading } = useAuditBatch(batchId);
  const { data: enterprises } = useEnterprises({ pageSize: 100, admissionStatus: "approved" });
  const { data: projects } = useAuditProjects({ batchId });
  const assignEnterprises = useAssignEnterprises(batchId);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showExtendDeadline, setShowExtendDeadline] = useState(false);
  const extendDeadline = useExtendBatchDeadline(batchId);

  if (batchLoading) return <PageLoading />;
  if (!batch) return <div className="p-8 text-center text-[hsl(var(--muted-foreground))]">批次不存在</div>;

  const assignedEnterpriseIds = new Set(projects?.items.map((p) => p.enterpriseId) ?? []);
  const availableEnterprises = enterprises?.items.filter((e) => !assignedEnterpriseIds.has(e.id)) ?? [];

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleAssign = async () => {
    if (selectedIds.size === 0) return;
    await assignEnterprises.mutateAsync({ enterpriseIds: Array.from(selectedIds) });
    setSelectedIds(new Set());
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/manager/batches")}>
          <ArrowLeft size={16} />
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">{batch.name}</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {batch.year}年度 · 共 {batch.totalProjects} 个项目
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowExtendDeadline(true)}>
          延期
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, color }) => (
          <Card key={key}>
            <div className="flex items-center gap-3">
              <Icon size={24} className={color} />
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
                <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                  {batch.stats[key] ?? 0}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Building2 size={20} />
              分配企业
            </span>
          </CardTitle>
          <Button
            size="sm"
            onClick={handleAssign}
            disabled={selectedIds.size === 0 || assignEnterprises.isPending}
          >
            {assignEnterprises.isPending ? "分配中..." : `分配企业 (${selectedIds.size})`}
          </Button>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">选择</TableHead>
              <TableHead>企业名称</TableHead>
              <TableHead>统一社会信用代码</TableHead>
              <TableHead>联系人</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {availableEnterprises.map((ent) => (
              <TableRow key={ent.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(ent.id)}
                    onChange={() => toggleSelect(ent.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </TableCell>
                <TableCell className="font-medium">{ent.name}</TableCell>
                <TableCell>{ent.unifiedSocialCreditCode}</TableCell>
                <TableCell>{ent.contactPerson ?? "-"}</TableCell>
              </TableRow>
            ))}
            {availableEnterprises.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[hsl(var(--muted-foreground))]">
                  暂无可分配企业
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <FileText size={20} />
              项目列表
            </span>
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>企业名称</TableHead>
              <TableHead>当前状态</TableHead>
              <TableHead>截止日期</TableHead>
              <TableHead>逾期</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects?.items.map((proj) => (
              <TableRow key={proj.id}>
                <TableCell className="font-medium">{proj.enterpriseName ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={proj.status === "completed" ? "success" : proj.isOverdue ? "danger" : "primary"}>
                    {STATUS_LABELS[proj.status] ?? proj.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(proj.deadline)}</TableCell>
                <TableCell>
                  {proj.isOverdue ? (
                    <Badge variant="danger">已逾期</Badge>
                  ) : (
                    <span className="text-[hsl(var(--muted-foreground))]">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/manager/projects/${proj.id}`)}
                  >
                    查看详情
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!projects?.items || projects.items.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[hsl(var(--muted-foreground))]">
                  暂无项目
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <DeadlineExtensionDialog
        open={showExtendDeadline}
        onClose={() => setShowExtendDeadline(false)}
        onSubmit={async (data) => {
          await extendDeadline.mutateAsync({ ...data, deadlineType: "filing" });
        }}
        isPending={extendDeadline.isPending}
        entityType="batch"
        currentDeadline={batch.filingDeadline}
      />
    </div>
  );
}

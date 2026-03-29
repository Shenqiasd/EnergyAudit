"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageLoading } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Layers, Plus } from "lucide-react";
import { useAuditBatches, useCreateBatch } from "@/lib/api/hooks/use-audit-batches";
import { useBusinessTypes } from "@/lib/api/hooks/use-business-types";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - 2 + i),
  label: `${currentYear - 2 + i}年`,
}));

const statusMap: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" }> = {
  draft: { label: "草稿", variant: "default" },
  active: { label: "进行中", variant: "primary" },
  closed: { label: "已关闭", variant: "danger" },
};

const businessTypeLabels: Record<string, string> = {
  energy_audit: "能源审计",
  energy_diagnosis: "节能诊断",
};

export default function ManagerBatchesPage() {
  const router = useRouter();
  const [yearFilter, setYearFilter] = useState<number | undefined>();
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string | undefined>();
  const [showCreate, setShowCreate] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    year: currentYear,
    description: "",
    filingDeadline: "",
    reviewDeadline: "",
    businessType: "energy_audit",
  });

  const { data, isLoading } = useAuditBatches({ year: yearFilter, businessType: businessTypeFilter });
  const { data: businessTypes } = useBusinessTypes();
  const createBatch = useCreateBatch();
  const queryClient = useQueryClient();
  const closeBatch = useMutation({
    mutationFn: (batchId: string) =>
      apiClient.put(`/audit-batches/${batchId}/close`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["audit-batches"] });
    },
  });

  const handleCreate = async () => {
    await createBatch.mutateAsync({
      name: formData.name,
      year: formData.year,
      description: formData.description || undefined,
      filingDeadline: formData.filingDeadline || undefined,
      reviewDeadline: formData.reviewDeadline || undefined,
      businessType: formData.businessType,
    });
    setShowCreate(false);
    setFormData({ name: "", year: currentYear, description: "", filingDeadline: "", reviewDeadline: "", businessType: "energy_audit" });
  };

  const handleClose = async (id: string) => {
    await closeBatch.mutateAsync(id);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">批次管理</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            创建和管理审计批次，分配企业到批次
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          新建批次
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Layers size={20} />
              批次列表
            </span>
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="w-48">
              <Select
                options={[{ value: "", label: "全部年度" }, ...yearOptions]}
                value={yearFilter ? String(yearFilter) : ""}
                onChange={(e) => setYearFilter(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
            <div className="w-48">
              <Select
                options={[
                  { value: "", label: "全部业务类型" },
                  ...(businessTypes?.map((bt) => ({ value: bt.businessType, label: bt.label })) ?? [
                    { value: "energy_audit", label: "能源审计" },
                    { value: "energy_diagnosis", label: "节能诊断" },
                  ]),
                ]}
                value={businessTypeFilter ?? ""}
                onChange={(e) => setBusinessTypeFilter(e.target.value || undefined)}
              />
            </div>
          </div>
        </CardHeader>

        {isLoading ? (
          <PageLoading />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>批次名称</TableHead>
                <TableHead>业务类型</TableHead>
                <TableHead>年度</TableHead>
                <TableHead>填报截止日期</TableHead>
                <TableHead>审核截止日期</TableHead>
                <TableHead>项目数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((batch) => {
                const statusInfo = statusMap[batch.status] ?? { label: batch.status, variant: "default" as const };
                return (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.name}</TableCell>
                    <TableCell>
                      <Badge variant="primary">
                        {businessTypeLabels[batch.businessType ?? "energy_audit"] ?? batch.businessType ?? "能源审计"}
                      </Badge>
                    </TableCell>
                    <TableCell>{batch.year}</TableCell>
                    <TableCell>{formatDate(batch.filingDeadline)}</TableCell>
                    <TableCell>{formatDate(batch.reviewDeadline)}</TableCell>
                    <TableCell>{batch.projectCount ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        {batch.isOverdue && (
                          <Badge variant="danger">
                            <AlertTriangle size={12} className="mr-0.5" />
                            超期
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/manager/batches/${batch.id}`)}
                        >
                          查看详情
                        </Button>
                        {batch.status !== "closed" && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleClose(batch.id)}
                          >
                            关闭批次
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!data?.items || data.items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-[var(--color-text-secondary)]">
                    暂无批次数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新建批次">
        <div className="space-y-4">
          <Input
            label="批次名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="例如：2026年度能源审计"
          />
          <Select
            label="年度"
            options={yearOptions}
            value={String(formData.year)}
            onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
          />
          <Select
            label="业务类型"
            options={[
              ...(businessTypes?.map((bt) => ({ value: bt.businessType, label: bt.label })) ?? [
                { value: "energy_audit", label: "能源审计" },
                { value: "energy_diagnosis", label: "节能诊断" },
              ]),
            ]}
            value={formData.businessType}
            onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
          />
          <Input
            label="描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="批次描述（可选）"
          />
          <Input
            label="填报截止日期"
            type="date"
            value={formData.filingDeadline}
            onChange={(e) => setFormData({ ...formData, filingDeadline: e.target.value })}
          />
          <Input
            label="审核截止日期"
            type="date"
            value={formData.reviewDeadline}
            onChange={(e) => setFormData({ ...formData, reviewDeadline: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || createBatch.isPending}
            >
              {createBatch.isPending ? "创建中..." : "创建"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

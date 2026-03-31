"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageLoading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/list/filter-bar";
import { AlertTriangle, Plus } from "lucide-react";
import { useAuditBatches, useCreateBatch } from "@/lib/api/hooks/use-audit-batches";
import type { AuditBatch } from "@/lib/api/hooks/use-audit-batches";
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
  const [searchName, setSearchName] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    year: currentYear,
    description: "",
    filingDeadline: "",
    reviewDeadline: "",
    businessType: "energy_audit",
  });

  const { data, isLoading } = useAuditBatches({
    year: yearFilter ? Number(yearFilter) : undefined,
    businessType: businessTypeFilter || undefined,
  });
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    if (!searchName) return items;
    return items.filter((b) => b.name.toLowerCase().includes(searchName.toLowerCase()));
  }, [data, searchName]);

  const columns: ColumnDef<AuditBatch, unknown>[] = [
    {
      accessorKey: "name",
      header: "批次名称",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "businessType",
      header: "业务类型",
      cell: ({ row }) => (
        <Badge variant="primary">
          {businessTypeLabels[row.original.businessType ?? "energy_audit"] ?? row.original.businessType ?? "能源审计"}
        </Badge>
      ),
    },
    {
      accessorKey: "year",
      header: "年度",
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        const info = statusMap[row.original.status] ?? { label: row.original.status, variant: "default" as const };
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant={info.variant}>{info.label}</Badge>
            {row.original.isOverdue && (
              <Badge variant="danger">
                <AlertTriangle size={12} className="mr-0.5" />
                超期
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "projectCount",
      header: "项目数",
      cell: ({ row }) => row.original.projectCount ?? 0,
    },
    {
      accessorKey: "filingDeadline",
      header: "填报截止",
      cell: ({ row }) => formatDate(row.original.filingDeadline),
    },
    {
      accessorKey: "createdAt",
      header: "创建日期",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: "操作",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/manager/batches/${row.original.id}`)}
          >
            查看详情
          </Button>
          {row.original.status !== "closed" && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => closeBatch.mutate(row.original.id)}
            >
              关闭批次
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="批次管理"
        description="管理审计批次和周期"
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            新建批次
          </Button>
        }
      />

      <FilterBar
        searchValue={searchName}
        onSearchChange={setSearchName}
        searchPlaceholder="搜索批次名称..."
        filters={[
          {
            key: "year",
            label: "年度",
            options: [{ value: "", label: "全部年度" }, ...yearOptions],
            value: yearFilter,
            onChange: setYearFilter,
          },
          {
            key: "businessType",
            label: "业务类型",
            options: [
              { value: "", label: "全部类型" },
              ...(businessTypes?.map((bt) => ({ value: bt.businessType, label: bt.label })) ?? [
                { value: "energy_audit", label: "能源审计" },
                { value: "energy_diagnosis", label: "节能诊断" },
              ]),
            ],
            value: businessTypeFilter,
            onChange: setBusinessTypeFilter,
          },
        ]}
      />

      {isLoading ? (
        <PageLoading />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="暂无批次数据"
          description={'点击右上角"新建批次"按钮创建新的审计批次'}
        />
      ) : (
        <DataTable columns={columns} data={filteredItems} />
      )}

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

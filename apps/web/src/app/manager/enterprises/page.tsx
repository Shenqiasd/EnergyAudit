"use client";

import { useState } from "react";
import { Plus, RefreshCw, Eye, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageLoading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { FilterBar } from "@/components/list/filter-bar";
import { ListCardView } from "@/components/list/list-card-view";
import { useEnterprises, useCreateEnterprise, useSyncEnterprise } from "@/lib/api/hooks/use-enterprises";
import type { Enterprise } from "@/lib/api/hooks/use-enterprises";

const STATUS_MAP: Record<string, { label: string; variant: "warning" | "success" | "danger" | "default" }> = {
  pending_review: { label: "待审核", variant: "warning" },
  approved: { label: "已通过", variant: "success" },
  rejected: { label: "已驳回", variant: "danger" },
  suspended: { label: "已停用", variant: "default" },
  locked: { label: "已锁定", variant: "default" },
  expired: { label: "已过期", variant: "default" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const columns: ColumnDef<Enterprise, unknown>[] = [
  {
    accessorKey: "name",
    header: "企业名称",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "unifiedSocialCreditCode",
    header: "统一社会信用代码",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.unifiedSocialCreditCode}</span>
    ),
  },
  {
    accessorKey: "industryCode",
    header: "行业",
    cell: ({ row }) => row.original.industryCode ?? "-",
  },
  {
    accessorKey: "admissionStatus",
    header: "准入状态",
    cell: ({ row }) => <StatusBadge status={row.original.admissionStatus} />,
    filterFn: "equals",
  },
  {
    accessorKey: "contactPerson",
    header: "联系人",
    cell: ({ row }) => row.original.contactPerson ?? "-",
  },
  {
    id: "actions",
    header: "操作",
    enableSorting: false,
    cell: ({ row }) => <EnterpriseActions enterprise={row.original} />,
  },
];

function EnterpriseActions({ enterprise }: { enterprise: Enterprise }) {
  const syncMutation = useSyncEnterprise(enterprise.id);

  return (
    <div className="flex gap-2">
      <a href={`/manager/enterprises/${enterprise.id}`}>
        <Button variant="ghost" size="sm">
          <Eye size={14} />
          查看
        </Button>
      </a>
      {enterprise.admissionStatus === "pending_review" && (
        <a href={`/manager/enterprises/${enterprise.id}/admission`}>
          <Button variant="ghost" size="sm">
            <CheckCircle size={14} />
            审核
          </Button>
        </a>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => syncMutation.mutate()}
        disabled={syncMutation.isPending}
      >
        <RefreshCw size={14} className={syncMutation.isPending ? "animate-spin" : ""} />
        同步
      </Button>
    </div>
  );
}

export default function ManagerEnterprisesPage() {
  const [page, setPage] = useState(1);
  const [searchName, setSearchName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formName, setFormName] = useState("");
  const [formCreditCode, setFormCreditCode] = useState("");
  const [formIndustry, setFormIndustry] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");

  const { data, isLoading } = useEnterprises({
    page,
    pageSize: 20,
    name: searchName || undefined,
    admissionStatus: filterStatus || undefined,
  });

  const createMutation = useCreateEnterprise();

  const handleCreate = () => {
    createMutation.mutate(
      {
        name: formName,
        unifiedSocialCreditCode: formCreditCode,
        industryCode: formIndustry || undefined,
        contactPerson: formContact || undefined,
        contactPhone: formPhone || undefined,
        contactEmail: formEmail || undefined,
        address: formAddress || undefined,
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          resetForm();
        },
      },
    );
  };

  const resetForm = () => {
    setFormName("");
    setFormCreditCode("");
    setFormIndustry("");
    setFormContact("");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="企业管理"
        description="管理所有已注册的审计企业"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            新增企业
          </Button>
        }
      />

      <FilterBar
        searchValue={searchName}
        onSearchChange={(val) => {
          setSearchName(val);
          setPage(1);
        }}
        searchPlaceholder="搜索企业名称..."
        filters={[
          {
            key: "status",
            label: "准入状态",
            options: [
              { value: "", label: "全部状态" },
              { value: "pending_review", label: "待审核" },
              { value: "approved", label: "已通过" },
              { value: "rejected", label: "已驳回" },
              { value: "suspended", label: "已停用" },
              { value: "locked", label: "已锁定" },
              { value: "expired", label: "已过期" },
            ],
            value: filterStatus,
            onChange: (val) => {
              setFilterStatus(val);
              setPage(1);
            },
          },
        ]}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {isLoading ? (
        <PageLoading />
      ) : items.length === 0 ? (
        <EmptyState
          title="暂无企业数据"
          description={'点击右上角"新增企业"按钮添加企业'}
        />
      ) : viewMode === "table" ? (
        <>
          <DataTable columns={columns} data={items} pageSize={20} />
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
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
      ) : (
        <ListCardView
          data={items}
          renderCard={(enterprise) => (
            <a key={enterprise.id} href={`/manager/enterprises/${enterprise.id}`}>
              <Card className="cursor-pointer p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{enterprise.name}</span>
                  <StatusBadge status={enterprise.admissionStatus} />
                </div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  {enterprise.industryCode ?? "未分类"}
                </div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  联系人: {enterprise.contactPerson ?? "-"}
                </div>
              </Card>
            </a>
          )}
          emptyTitle="暂无企业数据"
        />
      )}

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新增企业"
        className="max-w-xl"
      >
        <div className="space-y-4">
          <Input
            label="企业名称"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="请输入企业名称"
          />
          <Input
            label="统一社会信用代码"
            value={formCreditCode}
            onChange={(e) => setFormCreditCode(e.target.value)}
            placeholder="请输入18位信用代码"
          />
          <Input
            label="行业分类"
            value={formIndustry}
            onChange={(e) => setFormIndustry(e.target.value)}
            placeholder="请输入行业代码"
          />
          <Input
            label="联系人"
            value={formContact}
            onChange={(e) => setFormContact(e.target.value)}
            placeholder="请输入联系人姓名"
          />
          <Input
            label="联系电话"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            placeholder="请输入联系电话"
          />
          <Input
            label="联系邮箱"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            placeholder="请输入联系邮箱"
          />
          <Input
            label="地址"
            value={formAddress}
            onChange={(e) => setFormAddress(e.target.value)}
            placeholder="请输入企业地址"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formName || !formCreditCode || createMutation.isPending}
            >
              {createMutation.isPending ? "提交中..." : "提交申请"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

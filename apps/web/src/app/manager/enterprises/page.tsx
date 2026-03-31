"use client";

import { useState } from "react";
import { Building2, Plus, RefreshCw, Search, Eye, CheckCircle, MapPin } from "lucide-react";
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

export default function ManagerEnterprisesPage() {
  const [page, setPage] = useState(1);
  const [searchName, setSearchName] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formName, setFormName] = useState("");
  const [formCreditCode, setFormCreditCode] = useState("");
  const [formIndustry, setFormIndustry] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [filterRegion, setFilterRegion] = useState("");

  const { data, isLoading, refetch } = useEnterprises({
    page,
    pageSize: 20,
    name: searchName || undefined,
    creditCode: searchCode || undefined,
    admissionStatus: filterStatus || undefined,
    regionCode: filterRegion || undefined,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">企业管理</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            管理参与审计的企业信息、准入状态和企业账号
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          新增企业
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Building2 size={20} />
              企业列表
            </span>
          </CardTitle>
        </CardHeader>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="w-48">
            <Input
              placeholder="按企业名称搜索"
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-48">
            <Input
              placeholder="按信用代码搜索"
              value={searchCode}
              onChange={(e) => {
                setSearchCode(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-40">
            <Select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              placeholder="准入状态"
              options={[
                { value: "", label: "全部状态" },
                { value: "pending_review", label: "待审核" },
                { value: "approved", label: "已通过" },
                { value: "rejected", label: "已驳回" },
                { value: "suspended", label: "已停用" },
                { value: "locked", label: "已锁定" },
                { value: "expired", label: "已过期" },
              ]}
            />
          </div>
          <div className="w-40">
            <Input
              placeholder="区域筛选"
              value={filterRegion}
              onChange={(e) => {
                setFilterRegion(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            <Search size={14} />
            搜索
          </Button>
        </div>

        {isLoading ? (
          <PageLoading />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>企业名称</TableHead>
                  <TableHead>统一社会信用代码</TableHead>
                  <TableHead>行业分类</TableHead>
                  <TableHead>区域</TableHead>
                  <TableHead>省/市</TableHead>
                  <TableHead>准入状态</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((enterprise: Enterprise) => (
                  <EnterpriseRow key={enterprise.id} enterprise={enterprise} />
                ))}
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-[hsl(var(--muted-foreground))]">
                      暂无企业数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
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
        )}
      </Card>

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

function EnterpriseRow({ enterprise }: { enterprise: Enterprise }) {
  const syncMutation = useSyncEnterprise(enterprise.id);

  return (
    <TableRow>
      <TableCell className="font-medium">{enterprise.name}</TableCell>
      <TableCell className="font-mono text-xs">{enterprise.unifiedSocialCreditCode}</TableCell>
      <TableCell>{enterprise.industryCode ?? "-"}</TableCell>
      <TableCell>{enterprise.regionName ?? "-"}</TableCell>
      <TableCell>
        {enterprise.province || enterprise.city
          ? `${enterprise.province ?? ""}${enterprise.city ? " / " + enterprise.city : ""}`
          : "-"}
      </TableCell>
      <TableCell>
        <StatusBadge status={enterprise.admissionStatus} />
      </TableCell>
      <TableCell>{enterprise.contactPerson ?? "-"}</TableCell>
      <TableCell>
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
      </TableCell>
    </TableRow>
  );
}

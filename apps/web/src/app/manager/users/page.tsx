"use client";

import { useState } from "react";
import { Users, Plus, Search } from "lucide-react";
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
import { useUsers, useCreateUser, useUpdateUserRoles } from "@/lib/api/hooks/use-users";
import type { UserAccount } from "@/lib/api/hooks/use-users";

const ROLE_MAP: Record<string, { label: string; variant: "primary" | "success" | "warning" | "default" }> = {
  enterprise_user: { label: "企业用户", variant: "default" },
  enterprise_admin: { label: "企业管理员", variant: "primary" },
  manager: { label: "管理员", variant: "success" },
  reviewer: { label: "审核员", variant: "warning" },
};

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_MAP[role] ?? { label: role, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function ManagerUsersPage() {
  const [page, setPage] = useState(1);
  const [filterRole, setFilterRole] = useState("");
  const [searchName, setSearchName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("enterprise_user");
  const [formEnterpriseId, setFormEnterpriseId] = useState("");

  const [newRole, setNewRole] = useState("");

  const { data, isLoading, refetch } = useUsers({
    page,
    pageSize: 20,
    role: filterRole || undefined,
    name: searchName || undefined,
  });

  const createMutation = useCreateUser();
  const updateRolesMutation = useUpdateUserRoles(selectedUserId);

  const handleCreate = () => {
    createMutation.mutate(
      {
        name: formName,
        email: formEmail,
        phone: formPhone || undefined,
        role: formRole,
        enterpriseId: formEnterpriseId || undefined,
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          resetForm();
        },
      },
    );
  };

  const handleUpdateRole = () => {
    updateRolesMutation.mutate(
      { role: newRole },
      {
        onSuccess: () => {
          setShowRoleModal(false);
          setSelectedUserId("");
          setNewRole("");
        },
      },
    );
  };

  const openRoleModal = (user: UserAccount) => {
    setSelectedUserId(user.id);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormRole("enterprise_user");
    setFormEnterpriseId("");
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">用户管理</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            管理平台用户账号、角色分配和企业关联
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          新增用户
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Users size={20} />
              用户列表
            </span>
          </CardTitle>
        </CardHeader>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="w-48">
            <Input
              placeholder="按姓名搜索"
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-40">
            <Select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setPage(1);
              }}
              placeholder="角色筛选"
              options={[
                { value: "", label: "全部角色" },
                { value: "enterprise_user", label: "企业用户" },
                { value: "enterprise_admin", label: "企业管理员" },
                { value: "manager", label: "管理员" },
                { value: "reviewer", label: "审核员" },
              ]}
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
                  <TableHead>姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((user: UserAccount) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>{user.phone ?? "-"}</TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "success" : "default"}>
                        {user.status === "active" ? "活跃" : "停用"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openRoleModal(user)}>
                        分配角色
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-[hsl(var(--muted-foreground))]">
                      暂无用户数据
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
        title="新增用户"
      >
        <div className="space-y-4">
          <Input
            label="姓名"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="请输入姓名"
          />
          <Input
            label="邮箱"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            placeholder="请输入邮箱"
            type="email"
          />
          <Input
            label="手机号"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            placeholder="请输入手机号"
          />
          <Select
            label="角色"
            value={formRole}
            onChange={(e) => setFormRole(e.target.value)}
            options={[
              { value: "enterprise_user", label: "企业用户" },
              { value: "enterprise_admin", label: "企业管理员" },
              { value: "manager", label: "管理员" },
              { value: "reviewer", label: "审核员" },
            ]}
          />
          <Input
            label="关联企业ID（可选）"
            value={formEnterpriseId}
            onChange={(e) => setFormEnterpriseId(e.target.value)}
            placeholder="请输入企业ID"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formName || !formEmail || createMutation.isPending}
            >
              {createMutation.isPending ? "创建中..." : "创建用户"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="分配角色"
      >
        <div className="space-y-4">
          <Select
            label="选择角色"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            options={[
              { value: "enterprise_user", label: "企业用户" },
              { value: "enterprise_admin", label: "企业管理员" },
              { value: "manager", label: "管理员" },
              { value: "reviewer", label: "审核员" },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={!newRole || updateRolesMutation.isPending}
            >
              {updateRolesMutation.isPending ? "更新中..." : "确认分配"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

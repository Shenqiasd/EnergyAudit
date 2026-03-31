"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  useUnitDefinitions,
  useCreateUnitDefinition,
  useUpdateUnitDefinition,
  useDeleteUnitDefinition,
} from "@/lib/api/hooks/use-master-data";
import { useAuth } from "@/lib/auth/use-auth";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

import type { UnitDefinition } from "@/lib/api/hooks/use-master-data";

interface FormData {
  unitCode: string;
  name: string;
  unitType: string;
  energyBoundaryDescription: string;
}

const emptyForm: FormData = {
  unitCode: "",
  name: "",
  unitType: "production",
  energyBoundaryDescription: "",
};

const unitTypeOptions = [
  { value: "production", label: "生产单元" },
  { value: "auxiliary", label: "辅助单元" },
  { value: "office", label: "办公单元" },
  { value: "transport", label: "运输单元" },
  { value: "other", label: "其他" },
];

export default function UnitConfigPage() {
  const { user } = useAuth();
  const enterpriseId = user?.id ?? "";
  const { data: units, isLoading } = useUnitDefinitions(enterpriseId);
  const createMutation = useCreateUnitDefinition(enterpriseId);
  const updateMutation = useUpdateUnitDefinition(enterpriseId);
  const deleteMutation = useDeleteUnitDefinition(enterpriseId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: UnitDefinition) => {
    setEditingId(item.id);
    setForm({
      unitCode: item.unitCode,
      name: item.name,
      unitType: item.unitType,
      energyBoundaryDescription: item.energyBoundaryDescription ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      energyBoundaryDescription: form.energyBoundaryDescription || undefined,
    };

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        name: payload.name,
        unitType: payload.unitType,
        energyBoundaryDescription: payload.energyBoundaryDescription,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    setDeleteConfirmId(null);
  };

  const getUnitTypeLabel = (type: string) => {
    const opt = unitTypeOptions.find((o) => o.value === type);
    return opt?.label ?? type;
  };

  if (isLoading) {
    return <Loading size={32} text="加载单元定义..." className="min-h-[400px]" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/enterprise/config">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">单元定义配置</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            配置企业的用能单元及能源消耗边界
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>单元列表</CardTitle>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus size={16} />
            新增单元
          </Button>
        </CardHeader>

        {units && units.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>单元名称</TableHead>
                <TableHead>编码</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>能源消耗边界</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="font-mono text-xs">{item.unitCode}</TableCell>
                  <TableCell>
                    <Badge variant="primary">{getUnitTypeLabel(item.unitType)}</Badge>
                  </TableCell>
                  <TableCell>{item.energyBoundaryDescription ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? "success" : "default"}>
                      {item.isActive ? "启用" : "停用"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(item.id)}>
                        <Trash2 size={14} className="text-[hsl(var(--danger))]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
            暂无单元定义，请点击"新增单元"开始配置
          </p>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "编辑单元" : "新增单元"}
      >
        <div className="space-y-4">
          <Input
            label="单元编码"
            value={form.unitCode}
            onChange={(e) => setForm({ ...form, unitCode: e.target.value })}
            placeholder="如：workshop_1"
            disabled={!!editingId}
          />
          <Input
            label="单元名称"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="如：一号车间"
          />
          <Select
            label="单元类型"
            options={unitTypeOptions}
            value={form.unitType}
            onChange={(e) => setForm({ ...form, unitType: e.target.value })}
          />
          <Input
            label="能源消耗边界描述"
            value={form.energyBoundaryDescription}
            onChange={(e) =>
              setForm({ ...form, energyBoundaryDescription: e.target.value })
            }
            placeholder="描述该单元的能源消耗边界"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.unitCode || !form.name || !form.unitType}
            >
              {editingId ? "保存" : "创建"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="确认删除"
      >
        <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
          确定要删除该单元定义吗？此操作不可恢复。
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
            取消
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          >
            删除
          </Button>
        </div>
      </Modal>
    </div>
  );
}

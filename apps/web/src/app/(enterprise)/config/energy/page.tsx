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
  useEnergyDefinitions,
  useCreateEnergyDefinition,
  useUpdateEnergyDefinition,
  useDeleteEnergyDefinition,
} from "@/lib/api/hooks/use-master-data";
import { useAuth } from "@/lib/auth/use-auth";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

import type { EnergyDefinition } from "@/lib/api/hooks/use-master-data";

interface FormData {
  energyCode: string;
  name: string;
  energyType: string;
  conversionFactor: string;
  measurementUnit: string;
}

const emptyForm: FormData = {
  energyCode: "",
  name: "",
  energyType: "primary",
  conversionFactor: "",
  measurementUnit: "",
};

const energyTypeOptions = [
  { value: "primary", label: "一次能源" },
  { value: "secondary", label: "二次能源" },
];

export default function EnergyConfigPage() {
  const { user } = useAuth();
  const enterpriseId = user?.id ?? "";
  const { data: definitions, isLoading } = useEnergyDefinitions(enterpriseId);
  const createMutation = useCreateEnergyDefinition(enterpriseId);
  const updateMutation = useUpdateEnergyDefinition(enterpriseId);
  const deleteMutation = useDeleteEnergyDefinition(enterpriseId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: EnergyDefinition) => {
    setEditingId(item.id);
    setForm({
      energyCode: item.energyCode,
      name: item.name,
      energyType: item.energyType,
      conversionFactor: item.conversionFactor,
      measurementUnit: item.measurementUnit,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        name: form.name,
        energyType: form.energyType,
        conversionFactor: form.conversionFactor,
        measurementUnit: form.measurementUnit,
      });
    } else {
      await createMutation.mutateAsync(form);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    setDeleteConfirmId(null);
  };

  if (isLoading) {
    return <Loading size={32} text="加载能源品种..." className="min-h-[400px]" />;
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
          <h1 className="text-2xl font-bold text-[var(--color-text)]">能源品种配置</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            配置企业使用的能源品种及折标系数
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>能源品种列表</CardTitle>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus size={16} />
            新增能源品种
          </Button>
        </CardHeader>

        {definitions && definitions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>编码</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>折标系数</TableHead>
                <TableHead>计量单位</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {definitions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="font-mono text-xs">{item.energyCode}</TableCell>
                  <TableCell>
                    <Badge variant={item.energyType === "primary" ? "primary" : "default"}>
                      {item.energyType === "primary" ? "一次能源" : "二次能源"}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.conversionFactor}</TableCell>
                  <TableCell>{item.measurementUnit}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? "success" : "default"}>
                      {item.isActive ? "启用" : "停用"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(item.id)}
                      >
                        <Trash2 size={14} className="text-[var(--color-danger)]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
            暂无能源品种配置，请点击"新增能源品种"开始配置
          </p>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "编辑能源品种" : "新增能源品种"}
      >
        <div className="space-y-4">
          <Input
            label="能源编码"
            value={form.energyCode}
            onChange={(e) => setForm({ ...form, energyCode: e.target.value })}
            placeholder="如：coal, electricity"
            disabled={!!editingId}
          />
          <Input
            label="能源名称"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="如：原煤、电力"
          />
          <Select
            label="能源类型"
            options={energyTypeOptions}
            value={form.energyType}
            onChange={(e) => setForm({ ...form, energyType: e.target.value })}
          />
          <Input
            label="折标系数（kgce）"
            type="number"
            value={form.conversionFactor}
            onChange={(e) =>
              setForm({ ...form, conversionFactor: e.target.value })
            }
            placeholder="如：0.7143"
          />
          <Input
            label="计量单位"
            value={form.measurementUnit}
            onChange={(e) =>
              setForm({ ...form, measurementUnit: e.target.value })
            }
            placeholder="如：吨、千瓦时"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !form.energyCode ||
                !form.name ||
                !form.conversionFactor ||
                !form.measurementUnit
              }
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
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          确定要删除该能源品种定义吗？此操作不可恢复。
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

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
  useProductDefinitions,
  useCreateProductDefinition,
  useUpdateProductDefinition,
  useDeleteProductDefinition,
  useUnitDefinitions,
} from "@/lib/api/hooks/use-master-data";
import { useAuth } from "@/lib/auth/use-auth";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

import type { ProductDefinition } from "@/lib/api/hooks/use-master-data";

interface FormData {
  productCode: string;
  name: string;
  measurementUnit: string;
  unitDefinitionId: string;
  processDescription: string;
}

const emptyForm: FormData = {
  productCode: "",
  name: "",
  measurementUnit: "",
  unitDefinitionId: "",
  processDescription: "",
};

export default function ProductConfigPage() {
  const { user } = useAuth();
  const enterpriseId = user?.id ?? "";
  const { data: products, isLoading } = useProductDefinitions(enterpriseId);
  const { data: unitDefs } = useUnitDefinitions(enterpriseId);
  const createMutation = useCreateProductDefinition(enterpriseId);
  const updateMutation = useUpdateProductDefinition(enterpriseId);
  const deleteMutation = useDeleteProductDefinition(enterpriseId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const unitOptions = (unitDefs ?? []).map((u) => ({
    value: u.id,
    label: u.name,
  }));

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ProductDefinition) => {
    setEditingId(item.id);
    setForm({
      productCode: item.productCode,
      name: item.name,
      measurementUnit: item.measurementUnit,
      unitDefinitionId: item.unitDefinitionId ?? "",
      processDescription: item.processDescription ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      unitDefinitionId: form.unitDefinitionId || undefined,
      processDescription: form.processDescription || undefined,
    };

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        name: payload.name,
        measurementUnit: payload.measurementUnit,
        unitDefinitionId: payload.unitDefinitionId,
        processDescription: payload.processDescription,
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

  const getUnitName = (unitDefId: string | null) => {
    if (!unitDefId || !unitDefs) return "-";
    const unit = unitDefs.find((u) => u.id === unitDefId);
    return unit?.name ?? "-";
  };

  if (isLoading) {
    return <Loading size={32} text="加载产品定义..." className="min-h-[400px]" />;
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
          <h1 className="text-2xl font-bold text-[var(--color-text)]">产品定义配置</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            配置企业生产的产品类型及其计量单位
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>产品列表</CardTitle>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus size={16} />
            新增产品
          </Button>
        </CardHeader>

        {products && products.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>产品名称</TableHead>
                <TableHead>编码</TableHead>
                <TableHead>计量单位</TableHead>
                <TableHead>关联工序</TableHead>
                <TableHead>关联单元</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="font-mono text-xs">{item.productCode}</TableCell>
                  <TableCell>{item.measurementUnit}</TableCell>
                  <TableCell>{item.processDescription ?? "-"}</TableCell>
                  <TableCell>{getUnitName(item.unitDefinitionId)}</TableCell>
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
            暂无产品定义，请点击"新增产品"开始配置
          </p>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "编辑产品" : "新增产品"}
      >
        <div className="space-y-4">
          <Input
            label="产品编码"
            value={form.productCode}
            onChange={(e) => setForm({ ...form, productCode: e.target.value })}
            placeholder="如：steel_plate"
            disabled={!!editingId}
          />
          <Input
            label="产品名称"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="如：钢板"
          />
          <Input
            label="计量单位"
            value={form.measurementUnit}
            onChange={(e) => setForm({ ...form, measurementUnit: e.target.value })}
            placeholder="如：吨"
          />
          {unitOptions.length > 0 && (
            <Select
              label="关联单元"
              options={[{ value: "", label: "无" }, ...unitOptions]}
              value={form.unitDefinitionId}
              onChange={(e) => setForm({ ...form, unitDefinitionId: e.target.value })}
            />
          )}
          <Input
            label="工序描述"
            value={form.processDescription}
            onChange={(e) => setForm({ ...form, processDescription: e.target.value })}
            placeholder="如：热轧工序"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.productCode || !form.name || !form.measurementUnit}
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
          确定要删除该产品定义吗？此操作不可恢复。
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

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
  useCarbonFactors,
  useCreateCarbonFactor,
  useUpdateCarbonFactor,
} from "@/lib/api/hooks/use-master-data";
import { Plus, Pencil, Filter } from "lucide-react";

import type { CarbonEmissionFactor } from "@/lib/api/hooks/use-master-data";

interface FormData {
  energyCode: string;
  name: string;
  emissionFactor: string;
  oxidationRate: string;
  standardSource: string;
  applicableYear: string;
  measurementUnit: string;
  isDefault: boolean;
}

const emptyForm: FormData = {
  energyCode: "",
  name: "",
  emissionFactor: "",
  oxidationRate: "1.0",
  standardSource: "",
  applicableYear: String(new Date().getFullYear()),
  measurementUnit: "tCO2/t",
  isDefault: false,
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 10 }, (_, i) => ({
  value: String(currentYear - i),
  label: `${currentYear - i}年`,
}));

export default function CarbonFactorsPage() {
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const { data: factors, isLoading } = useCarbonFactors(selectedYear);
  const createMutation = useCreateCarbonFactor();
  const updateMutation = useUpdateCarbonFactor();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: CarbonEmissionFactor) => {
    setEditingId(item.id);
    setForm({
      energyCode: item.energyCode,
      name: item.name,
      emissionFactor: item.emissionFactor,
      oxidationRate: item.oxidationRate,
      standardSource: item.standardSource ?? "",
      applicableYear: item.applicableYear ? String(item.applicableYear) : "",
      measurementUnit: item.measurementUnit,
      isDefault: item.isDefault,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      energyCode: form.energyCode,
      name: form.name,
      emissionFactor: form.emissionFactor,
      oxidationRate: form.oxidationRate || undefined,
      standardSource: form.standardSource || undefined,
      applicableYear: form.applicableYear ? parseInt(form.applicableYear, 10) : undefined,
      measurementUnit: form.measurementUnit,
      isDefault: form.isDefault,
    };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setModalOpen(false);
  };

  if (isLoading) {
    return <Loading size={32} text="加载碳排放因子..." className="min-h-[400px]" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">碳排放因子管理</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          管理平台级碳排放因子，企业可在此基础上进行覆盖配置
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>碳排放因子列表</CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-[hsl(var(--muted-foreground))]" />
              <Select
                options={[{ value: "", label: "全部年份" }, ...yearOptions]}
                value={selectedYear ? String(selectedYear) : ""}
                onChange={(e) =>
                  setSelectedYear(e.target.value ? parseInt(e.target.value, 10) : undefined)
                }
              />
            </div>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus size={16} />
              新增因子
            </Button>
          </div>
        </CardHeader>

        {factors && factors.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>能源品种</TableHead>
                <TableHead>因子值</TableHead>
                <TableHead>氧化率</TableHead>
                <TableHead>来源标准</TableHead>
                <TableHead>适用年份</TableHead>
                <TableHead>计量单位</TableHead>
                <TableHead>是否默认</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factors.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.energyCode}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{item.emissionFactor}</TableCell>
                  <TableCell className="font-mono">{item.oxidationRate}</TableCell>
                  <TableCell>{item.standardSource ?? "-"}</TableCell>
                  <TableCell>{item.applicableYear ?? "-"}</TableCell>
                  <TableCell>{item.measurementUnit}</TableCell>
                  <TableCell>
                    <Badge variant={item.isDefault ? "primary" : "default"}>
                      {item.isDefault ? "默认" : "非默认"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)}>
                      <Pencil size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
            暂无碳排放因子数据
          </p>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "编辑碳排放因子" : "新增碳排放因子"}
        className="max-w-xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="能源编码"
              value={form.energyCode}
              onChange={(e) => setForm({ ...form, energyCode: e.target.value })}
              placeholder="如：coal"
              disabled={!!editingId}
            />
            <Input
              label="能源名称"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="如：原煤"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="排放因子"
              type="number"
              value={form.emissionFactor}
              onChange={(e) => setForm({ ...form, emissionFactor: e.target.value })}
              placeholder="如：1.9003"
            />
            <Input
              label="氧化率"
              type="number"
              value={form.oxidationRate}
              onChange={(e) => setForm({ ...form, oxidationRate: e.target.value })}
              placeholder="如：0.98"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="来源标准"
              value={form.standardSource}
              onChange={(e) => setForm({ ...form, standardSource: e.target.value })}
              placeholder="如：GB/T 2589-2020"
            />
            <Select
              label="适用年份"
              options={[{ value: "", label: "不限年份" }, ...yearOptions]}
              value={form.applicableYear}
              onChange={(e) => setForm({ ...form, applicableYear: e.target.value })}
            />
          </div>
          <Input
            label="计量单位"
            value={form.measurementUnit}
            onChange={(e) => setForm({ ...form, measurementUnit: e.target.value })}
            placeholder="如：tCO2/t"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="rounded border-[hsl(var(--border))]"
            />
            设为默认因子
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !form.energyCode || !form.name || !form.emissionFactor || !form.measurementUnit
              }
            >
              {editingId ? "保存" : "创建"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

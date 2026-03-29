"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
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
  useBenchmarks,
  useCreateBenchmark,
  useUpdateBenchmark,
  useDeleteBenchmark,
} from "@/lib/api/hooks/use-benchmarks";
import { Plus, Pencil, Trash2, Filter } from "lucide-react";

import type { BenchmarkValue } from "@/lib/api/hooks/use-benchmarks";

interface FormData {
  industryCode: string;
  indicatorCode: string;
  indicatorName: string;
  benchmarkValue: string;
  unit: string;
  source: string;
  applicableYear: string;
}

const emptyForm: FormData = {
  industryCode: "",
  indicatorCode: "",
  indicatorName: "",
  benchmarkValue: "",
  unit: "",
  source: "",
  applicableYear: String(new Date().getFullYear()),
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 10 }, (_, i) => ({
  value: String(currentYear - i),
  label: `${currentYear - i}年`,
}));

const indicatorOptions = [
  { value: "", label: "全部指标" },
  { value: "comprehensive_energy_intensity", label: "综合能耗强度" },
  { value: "product_unit_energy", label: "产品单位能耗" },
  { value: "equipment_efficiency", label: "设备能效" },
  { value: "total_carbon_emission", label: "碳排放总量" },
];

export default function BenchmarksPage() {
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterIndicator, setFilterIndicator] = useState("");
  const [filterYear, setFilterYear] = useState<number | undefined>(undefined);

  const { data: benchmarks, isLoading } = useBenchmarks({
    industryCode: filterIndustry || undefined,
    indicatorCode: filterIndicator || undefined,
    applicableYear: filterYear,
  });
  const createMutation = useCreateBenchmark();
  const updateMutation = useUpdateBenchmark();
  const deleteMutation = useDeleteBenchmark();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: BenchmarkValue) => {
    setEditingId(item.id);
    setForm({
      industryCode: item.industryCode,
      indicatorCode: item.indicatorCode,
      indicatorName: item.indicatorName,
      benchmarkValue: item.benchmarkValue,
      unit: item.unit ?? "",
      source: item.source ?? "",
      applicableYear: item.applicableYear ? String(item.applicableYear) : "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      industryCode: form.industryCode,
      indicatorCode: form.indicatorCode,
      indicatorName: form.indicatorName,
      benchmarkValue: form.benchmarkValue,
      unit: form.unit || undefined,
      source: form.source || undefined,
      applicableYear: form.applicableYear
        ? parseInt(form.applicableYear, 10)
        : undefined,
    };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("确定要删除此对标值吗？")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <Loading size={32} text="加载对标数据..." className="min-h-[400px]" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">能效对标管理</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          管理各行业能效对标值，用于企业能效对比分析
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>对标值列表</CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-[var(--color-text-secondary)]" />
              <Input
                placeholder="行业代码"
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                className="w-28"
              />
              <Select
                options={indicatorOptions}
                value={filterIndicator}
                onChange={(e) => setFilterIndicator(e.target.value)}
              />
              <Select
                options={[{ value: "", label: "全部年份" }, ...yearOptions]}
                value={filterYear ? String(filterYear) : ""}
                onChange={(e) =>
                  setFilterYear(
                    e.target.value ? parseInt(e.target.value, 10) : undefined,
                  )
                }
              />
            </div>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus size={16} />
              新增对标值
            </Button>
          </div>
        </CardHeader>

        {benchmarks && benchmarks.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>行业代码</TableHead>
                <TableHead>指标编码</TableHead>
                <TableHead>指标名称</TableHead>
                <TableHead>对标值</TableHead>
                <TableHead>单位</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>适用年份</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {benchmarks.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">{item.industryCode}</TableCell>
                  <TableCell className="font-mono text-xs">{item.indicatorCode}</TableCell>
                  <TableCell>{item.indicatorName}</TableCell>
                  <TableCell className="font-mono">{item.benchmarkValue}</TableCell>
                  <TableCell>{item.unit ?? "-"}</TableCell>
                  <TableCell className="text-xs">{item.source ?? "-"}</TableCell>
                  <TableCell>{item.applicableYear ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
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
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
            暂无对标数据
          </p>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "编辑对标值" : "新增对标值"}
        className="max-w-xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="行业代码"
              value={form.industryCode}
              onChange={(e) => setForm({ ...form, industryCode: e.target.value })}
              placeholder="如：2511"
              disabled={!!editingId}
            />
            <Select
              label="指标编码"
              options={indicatorOptions.filter((o) => o.value !== "")}
              value={form.indicatorCode}
              onChange={(e) => setForm({ ...form, indicatorCode: e.target.value })}
            />
          </div>
          <Input
            label="指标名称"
            value={form.indicatorName}
            onChange={(e) => setForm({ ...form, indicatorName: e.target.value })}
            placeholder="如：综合能耗强度"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="对标值"
              type="number"
              value={form.benchmarkValue}
              onChange={(e) =>
                setForm({ ...form, benchmarkValue: e.target.value })
              }
              placeholder="如：0.85"
            />
            <Input
              label="单位"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="如：tce/万元"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="来源标准"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="如：GB/T 2589-2020"
            />
            <Select
              label="适用年份"
              options={[{ value: "", label: "不限年份" }, ...yearOptions]}
              value={form.applicableYear}
              onChange={(e) =>
                setForm({ ...form, applicableYear: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !form.industryCode ||
                !form.indicatorCode ||
                !form.indicatorName ||
                !form.benchmarkValue
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

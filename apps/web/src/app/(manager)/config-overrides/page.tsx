"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import {
  useConfigOverrides,
  useSetConfigOverride,
  useDeleteConfigOverride,
  useEffectiveConfig,
} from "@/lib/api/hooks/use-config-overrides";
import { Plus, Trash2, Eye, Save } from "lucide-react";

import type { ConfigOverride } from "@/lib/api/hooks/use-config-overrides";

const scopeTypes = [
  { value: "platform", label: "平台默认" },
  { value: "batch_template", label: "批次模板" },
  { value: "enterprise_type", label: "企业类型" },
  { value: "enterprise", label: "企业特例" },
];

const targetTypes = [
  { value: "module", label: "模块" },
  { value: "field", label: "字段" },
  { value: "validation_rule", label: "校验规则" },
];

interface OverrideFormData {
  scopeType: string;
  scopeId: string;
  targetType: string;
  targetCode: string;
  configJson: string;
}

const emptyForm: OverrideFormData = {
  scopeType: "platform",
  scopeId: "",
  targetType: "module",
  targetCode: "",
  configJson: "{}",
};

export default function ConfigOverridesPage() {
  const [activeScopeType, setActiveScopeType] = useState("platform");
  const [scopeIdFilter, setScopeIdFilter] = useState("");
  const { data: overrides, isLoading } = useConfigOverrides(
    activeScopeType,
    scopeIdFilter || undefined,
  );
  const setMutation = useSetConfigOverride();
  const deleteMutation = useDeleteConfigOverride();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<OverrideFormData>(emptyForm);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ConfigOverride | null>(null);

  // Preview effective config
  const [previewModule, setPreviewModule] = useState("");
  const [previewEnterprise, setPreviewEnterprise] = useState("");
  const [previewBatch, setPreviewBatch] = useState("");
  const [previewIndustry, setPreviewIndustry] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const { data: effectiveConfig, isLoading: previewLoading } = useEffectiveConfig(
    previewModule,
    {
      enterpriseId: previewEnterprise || undefined,
      batchId: previewBatch || undefined,
      industryCode: previewIndustry || undefined,
    },
  );

  const handleOpenCreate = () => {
    setForm({ ...emptyForm, scopeType: activeScopeType });
    setJsonError(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const parsed = JSON.parse(form.configJson);
      setJsonError(null);
      await setMutation.mutateAsync({
        scopeType: form.scopeType,
        scopeId: form.scopeId || undefined,
        targetType: form.targetType,
        targetCode: form.targetCode,
        configJson: parsed,
      });
      setModalOpen(false);
    } catch (e) {
      if (e instanceof SyntaxError) {
        setJsonError("JSON 格式无效");
      }
    }
  };

  const handleDelete = async (item: ConfigOverride) => {
    await deleteMutation.mutateAsync(item.id);
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          配置优先级覆盖管理
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          管理4层配置覆盖：平台默认 &lt; 批次模板 &lt; 企业类型 &lt; 企业特例
        </p>
      </div>

      <div className="flex gap-2 border-b border-[var(--color-border)]">
        {scopeTypes.map((scope) => (
          <button
            key={scope.value}
            onClick={() => {
              setActiveScopeType(scope.value);
              setScopeIdFilter("");
            }}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeScopeType === scope.value
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            {scope.label}
          </button>
        ))}
      </div>

      {activeScopeType !== "platform" && (
        <div className="flex items-center gap-3">
          <Input
            label={
              activeScopeType === "batch_template"
                ? "批次ID"
                : activeScopeType === "enterprise_type"
                  ? "行业编码"
                  : "企业ID"
            }
            value={scopeIdFilter}
            onChange={(e) => setScopeIdFilter(e.target.value)}
            placeholder="输入范围ID进行筛选"
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {scopeTypes.find((s) => s.value === activeScopeType)?.label ?? ""} 配置覆盖
          </CardTitle>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="secondary" onClick={() => setPreviewOpen(true)}>
              <Eye size={16} />
              预览有效配置
            </Button>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus size={16} />
              新增覆盖
            </Button>
          </div>
        </CardHeader>

        {isLoading ? (
          <Loading text="加载配置覆盖..." className="py-8" />
        ) : overrides && overrides.length > 0 ? (
          <div className="divide-y divide-[var(--color-border)]">
            {overrides.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-4 py-3"
              >
                <Badge variant="default" className="text-xs">
                  {targetTypes.find((t) => t.value === item.targetType)?.label}
                </Badge>
                <span className="font-mono text-sm text-[var(--color-text)]">
                  {item.targetCode}
                </span>
                {item.scopeId && (
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    范围: {item.scopeId}
                  </span>
                )}
                <span className="flex-1 truncate font-mono text-xs text-[var(--color-text-secondary)]">
                  {JSON.stringify(item.configJson)}
                </span>
                <Badge
                  variant={item.isActive ? "success" : "default"}
                  className="text-xs"
                >
                  {item.isActive ? "启用" : "停用"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirm(item)}
                >
                  <Trash2 size={12} className="text-[var(--color-danger)]" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
            暂无配置覆盖
          </p>
        )}
      </Card>

      {/* Create/Edit Override Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增配置覆盖"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              范围类型
            </label>
            <select
              value={form.scopeType}
              onChange={(e) => setForm({ ...form, scopeType: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            >
              {scopeTypes.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {form.scopeType !== "platform" && (
            <Input
              label="范围ID"
              value={form.scopeId}
              onChange={(e) => setForm({ ...form, scopeId: e.target.value })}
              placeholder={
                form.scopeType === "batch_template"
                  ? "批次ID"
                  : form.scopeType === "enterprise_type"
                    ? "行业编码"
                    : "企业ID"
              }
            />
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              目标类型
            </label>
            <select
              value={form.targetType}
              onChange={(e) =>
                setForm({ ...form, targetType: e.target.value })
              }
              className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            >
              {targetTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="目标编码"
            value={form.targetCode}
            onChange={(e) => setForm({ ...form, targetCode: e.target.value })}
            placeholder="模块编码 / 字段编码 / 规则编码"
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              覆盖配置 (JSON)
            </label>
            <textarea
              value={form.configJson}
              onChange={(e) => {
                setForm({ ...form, configJson: e.target.value });
                setJsonError(null);
              }}
              rows={6}
              className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 font-mono text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder='{"isEnabled": false}'
            />
            {jsonError && (
              <p className="mt-1 text-xs text-[var(--color-danger)]">
                {jsonError}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.targetCode || !form.configJson}
            >
              <Save size={16} />
              保存
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Effective Config Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="预览有效配置"
      >
        <div className="space-y-4">
          <Input
            label="模块编码"
            value={previewModule}
            onChange={(e) => setPreviewModule(e.target.value)}
            placeholder="例如: energy-flow"
          />
          <Input
            label="企业ID（可选）"
            value={previewEnterprise}
            onChange={(e) => setPreviewEnterprise(e.target.value)}
            placeholder="企业ID"
          />
          <Input
            label="批次ID（可选）"
            value={previewBatch}
            onChange={(e) => setPreviewBatch(e.target.value)}
            placeholder="批次ID"
          />
          <Input
            label="行业编码（可选）"
            value={previewIndustry}
            onChange={(e) => setPreviewIndustry(e.target.value)}
            placeholder="行业编码"
          />

          {previewLoading ? (
            <Loading text="加载有效配置..." className="py-4" />
          ) : effectiveConfig ? (
            <div className="max-h-80 overflow-auto rounded-lg bg-gray-50 p-3">
              <pre className="whitespace-pre-wrap font-mono text-xs text-[var(--color-text)]">
                {JSON.stringify(effectiveConfig, null, 2)}
              </pre>
            </div>
          ) : previewModule ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              输入模块编码后查看有效配置
            </p>
          ) : null}

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
              关闭
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="确认删除"
      >
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          确定要删除此配置覆盖吗？目标：{deleteConfirm?.targetCode}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            取消
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            删除
          </Button>
        </div>
      </Modal>
    </div>
  );
}

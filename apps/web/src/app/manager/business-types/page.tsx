"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageLoading } from "@/components/ui/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings, Plus } from "lucide-react";
import {
  useBusinessTypes,
  useCreateBusinessType,
  useUpdateBusinessType,
  useModuleVisibility,
  useSetModuleVisibility,
} from "@/lib/api/hooks/use-business-types";
import type {
  BusinessTypeConfig,
  ModuleVisibilityInput,
} from "@/lib/api/hooks/use-business-types";

const AVAILABLE_MODULES = [
  { code: "energy-flow", label: "能源流向" },
  { code: "energy-consumption", label: "能源消费" },
  { code: "carbon-emission", label: "碳排放" },
  { code: "equipment-efficiency", label: "设备能效" },
  { code: "energy-balance", label: "能源平衡" },
  { code: "production-data", label: "生产数据" },
  { code: "enterprise-info", label: "企业信息" },
  { code: "energy-management", label: "能源管理" },
];

export default function BusinessTypesPage() {
  const { data: businessTypes, isLoading } = useBusinessTypes();
  const createBusinessType = useCreateBusinessType();

  const [showCreate, setShowCreate] = useState(false);
  const [editingType, setEditingType] = useState<BusinessTypeConfig | null>(null);
  const [configuringModules, setConfiguringModules] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    businessType: "",
    label: "",
    description: "",
  });

  const handleCreate = async () => {
    await createBusinessType.mutateAsync({
      businessType: createForm.businessType,
      label: createForm.label,
      description: createForm.description || undefined,
    });
    setShowCreate(false);
    setCreateForm({ businessType: "", label: "", description: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            业务类型管理
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            配置平台支持的业务类型，管理模块可见性
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          新建业务类型
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Settings size={20} />
              业务类型列表
            </span>
          </CardTitle>
        </CardHeader>

        {isLoading ? (
          <PageLoading />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>业务类型代码</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businessTypes?.map((bt) => (
                <TableRow key={bt.id}>
                  <TableCell className="font-mono text-sm">
                    {bt.businessType}
                  </TableCell>
                  <TableCell className="font-medium">{bt.label}</TableCell>
                  <TableCell className="text-[var(--color-text-secondary)]">
                    {bt.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={bt.isActive ? "success" : "default"}>
                      {bt.isActive ? "启用" : "停用"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingType(bt)}
                      >
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfiguringModules(bt.businessType)}
                      >
                        模块配置
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!businessTypes || businessTypes.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-[var(--color-text-secondary)]"
                  >
                    暂无业务类型数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="新建业务类型"
      >
        <div className="space-y-4">
          <Input
            label="业务类型代码"
            value={createForm.businessType}
            onChange={(e) =>
              setCreateForm({ ...createForm, businessType: e.target.value })
            }
            placeholder="例如：energy_audit"
          />
          <Input
            label="名称"
            value={createForm.label}
            onChange={(e) =>
              setCreateForm({ ...createForm, label: e.target.value })
            }
            placeholder="例如：能源审计"
          />
          <Input
            label="描述"
            value={createForm.description}
            onChange={(e) =>
              setCreateForm({ ...createForm, description: e.target.value })
            }
            placeholder="业务类型描述（可选）"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !createForm.businessType ||
                !createForm.label ||
                createBusinessType.isPending
              }
            >
              {createBusinessType.isPending ? "创建中..." : "创建"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      {editingType && (
        <EditBusinessTypeModal
          config={editingType}
          onClose={() => setEditingType(null)}
        />
      )}

      {/* Module Visibility Modal */}
      {configuringModules && (
        <ModuleVisibilityModal
          businessType={configuringModules}
          onClose={() => setConfiguringModules(null)}
        />
      )}
    </div>
  );
}

function EditBusinessTypeModal({
  config,
  onClose,
}: {
  config: BusinessTypeConfig;
  onClose: () => void;
}) {
  const updateBusinessType = useUpdateBusinessType(config.businessType);
  const [form, setForm] = useState({
    label: config.label,
    description: config.description || "",
    isActive: config.isActive,
  });

  const handleSave = async () => {
    await updateBusinessType.mutateAsync({
      label: form.label,
      description: form.description || undefined,
      isActive: form.isActive,
    });
    onClose();
  };

  return (
    <Modal open={true} onClose={onClose} title="编辑业务类型">
      <div className="space-y-4">
        <Input
          label="名称"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        />
        <Input
          label="描述"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[var(--color-text)]">
            启用状态
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            onClick={() => setForm({ ...form, isActive: !form.isActive })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.isActive ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.label || updateBusinessType.isPending}
          >
            {updateBusinessType.isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ModuleVisibilityModal({
  businessType,
  onClose,
}: {
  businessType: string;
  onClose: () => void;
}) {
  const { data: currentVisibility, isLoading } =
    useModuleVisibility(businessType);
  const setModuleVisibility = useSetModuleVisibility(businessType);

  const [modules, setModules] = useState<ModuleVisibilityInput[]>(() =>
    AVAILABLE_MODULES.map((m, idx) => ({
      moduleCode: m.code,
      isVisible: true,
      isRequired: false,
      sortOrder: idx,
    })),
  );

  // Sync with server data when loaded
  const [initialized, setInitialized] = useState(false);
  if (currentVisibility && currentVisibility.length > 0 && !initialized) {
    const serverModules = AVAILABLE_MODULES.map((m, idx) => {
      const existing = currentVisibility.find(
        (v) => v.moduleCode === m.code,
      );
      return {
        moduleCode: m.code,
        isVisible: existing ? existing.isVisible : true,
        isRequired: existing ? existing.isRequired : false,
        sortOrder: existing ? existing.sortOrder : idx,
      };
    });
    setModules(serverModules);
    setInitialized(true);
  }

  const toggleVisible = (moduleCode: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.moduleCode === moduleCode
          ? { ...m, isVisible: !m.isVisible, isRequired: !m.isVisible ? m.isRequired : false }
          : m,
      ),
    );
  };

  const toggleRequired = (moduleCode: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.moduleCode === moduleCode ? { ...m, isRequired: !m.isRequired } : m,
      ),
    );
  };

  const handleSave = async () => {
    await setModuleVisibility.mutateAsync(modules);
    onClose();
  };

  return (
    <Modal open={true} onClose={onClose} title={`模块可见性配置 - ${businessType}`}>
      {isLoading ? (
        <PageLoading />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模块</TableHead>
                <TableHead>可见</TableHead>
                <TableHead>必填</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AVAILABLE_MODULES.map((am) => {
                const mod = modules.find((m) => m.moduleCode === am.code);
                return (
                  <TableRow key={am.code}>
                    <TableCell>{am.label}</TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={mod?.isVisible ?? true}
                        onChange={() => toggleVisible(am.code)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={mod?.isRequired ?? false}
                        disabled={!mod?.isVisible}
                        onChange={() => toggleRequired(am.code)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={setModuleVisibility.isPending}
            >
              {setModuleVisibility.isPending ? "保存中..." : "保存配置"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

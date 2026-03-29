"use client";

import { useCallback, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { DraftRecoveryBanner } from "@/components/draft-recovery-banner";
import { AutoSaveIndicator } from "@/components/auto-save-indicator";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { clearDraft } from "@/lib/draft-storage";
import { useAuth } from "@/lib/auth/use-auth";
import {
  useDataModules,
  useDataRecord,
  useSaveRecord,
} from "@/lib/api/hooks/use-data-entry";
import { FileText, Save } from "lucide-react";

interface FormValues {
  [fieldCode: string]: string;
}

export default function FilingPage() {
  const { user } = useAuth();
  const projectId = user?.id ?? "";

  const [selectedModuleCode, setSelectedModuleCode] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormValues>({});

  const { data: modules, isLoading: modulesLoading } = useDataModules(projectId);
  const { data: recordDetail } = useDataRecord(selectedRecordId ?? "");
  const saveMutation = useSaveRecord(selectedRecordId ?? "");
  const { isOnline, wasOffline } = useOnlineStatus();

  // Auto-save hook
  const { lastSaved, isSaving, isOffline: autoSaveOffline, saveNow } = useAutoSave(
    projectId,
    selectedModuleCode ?? "",
    formData,
    { enabled: !!selectedModuleCode },
  );

  const serverDataTimestamp = useMemo(
    () => recordDetail?.updatedAt ?? null,
    [recordDetail],
  );

  // Sync to server when coming back online
  const isSyncing = wasOffline && isOnline;

  const handleModuleSelect = useCallback(
    (moduleCode: string, recordId: string | null) => {
      setSelectedModuleCode(moduleCode);
      setSelectedRecordId(recordId);
      setFormData({});
    },
    [],
  );

  const handleDraftRecover = useCallback((data: unknown) => {
    if (data && typeof data === "object") {
      setFormData(data as FormValues);
    }
  }, []);

  const handleFieldChange = useCallback(
    (fieldCode: string, value: string) => {
      setFormData((prev) => ({ ...prev, [fieldCode]: value }));
    },
    [],
  );

  const handleSaveToServer = useCallback(async () => {
    if (!selectedRecordId) return;

    const items = Object.entries(formData).map(([fieldCode, rawValue]) => ({
      fieldCode,
      rawValue: rawValue || null,
    }));

    await saveMutation.mutateAsync({ items });

    // Clear draft after successful server save
    if (selectedModuleCode) {
      clearDraft(projectId, selectedModuleCode);
    }
  }, [selectedRecordId, formData, saveMutation, projectId, selectedModuleCode]);

  if (modulesLoading) {
    return <Loading size={32} text="加载模块列表..." className="min-h-[400px]" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">数据填报</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            选择模块进行数据填报，支持离线自动保存
          </p>
        </div>
        {selectedModuleCode && (
          <div className="flex items-center gap-4">
            <AutoSaveIndicator
              isSaving={isSaving}
              isOffline={autoSaveOffline}
              lastSaved={lastSaved}
              isSyncing={isSyncing}
            />
            <Button
              size="sm"
              onClick={handleSaveToServer}
              disabled={!selectedRecordId || saveMutation.isPending || !isOnline}
            >
              <Save size={16} />
              {saveMutation.isPending ? "提交中..." : "保存至服务器"}
            </Button>
          </div>
        )}
      </div>

      {/* Draft Recovery Banner */}
      {selectedModuleCode && (
        <DraftRecoveryBanner
          projectId={projectId}
          moduleCode={selectedModuleCode}
          serverDataTimestamp={serverDataTimestamp}
          onRecover={handleDraftRecover}
        />
      )}

      {/* Module List */}
      {!selectedModuleCode && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules?.map((mod) => (
            <Card
              key={mod.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => handleModuleSelect(mod.code, mod.recordId ?? null)}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[var(--color-primary)]" />
                  <CardTitle>{mod.name}</CardTitle>
                </div>
              </CardHeader>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {mod.description ?? "暂无描述"}
              </p>
              <div className="mt-3 text-xs text-[var(--color-text-secondary)]">
                状态: {mod.recordStatus === "not_started" ? "未开始" : mod.recordStatus}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Simple Form Area (when module selected) */}
      {selectedModuleCode && (
        <Card>
          <CardHeader>
            <CardTitle>
              {modules?.find((m) => m.code === selectedModuleCode)?.name ?? selectedModuleCode}
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                saveNow();
                setSelectedModuleCode(null);
                setSelectedRecordId(null);
                setFormData({});
              }}
            >
              返回模块列表
            </Button>
          </CardHeader>

          {recordDetail?.items && recordDetail.items.length > 0 ? (
            <div className="space-y-3">
              {recordDetail.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <label className="w-40 text-sm font-medium text-[var(--color-text)]">
                    {item.fieldCode}
                  </label>
                  <input
                    type="text"
                    value={formData[item.fieldCode] ?? item.rawValue ?? ""}
                    onChange={(e) => handleFieldChange(item.fieldCode, e.target.value)}
                    className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
              暂无数据字段，请先创建数据记录
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

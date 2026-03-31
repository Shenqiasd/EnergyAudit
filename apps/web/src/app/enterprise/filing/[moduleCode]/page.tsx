"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DataReturnBanner } from "@/components/data-return-dialog";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import {
  useCreateRecord,
  useDataModules,
  useDataRecord,
  useModuleFields,
  useSaveRecord,
  useSubmitRecord,
  useValidateRecord,
} from "@/lib/api/hooks/use-data-entry";
import { clsx } from "clsx";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Info,
  Lock,
  Save,
  Send,
} from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState } from "react";

import type { ValidationError } from "@/lib/api/hooks/use-data-entry";

interface ModuleRunnerPageProps {
  params: Promise<{ moduleCode: string }>;
}

export default function ModuleRunnerPage({ params }: ModuleRunnerPageProps) {
  const { moduleCode } = use(params);
  const { data: fieldsData, isLoading: fieldsLoading } =
    useModuleFields(moduleCode);
  const { data: modules } = useDataModules();

  const currentModule = modules?.find((m) => m.code === moduleCode);
  const recordId = currentModule?.recordId ?? "";

  const { data: recordDetail, isLoading: recordLoading } =
    useDataRecord(recordId);

  const createRecord = useCreateRecord();
  const saveRecord = useSaveRecord(recordId);
  const submitRecord = useSubmitRecord(recordId);
  const validateRecord = useValidateRecord(recordId);

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [validationWarnings, setValidationWarnings] = useState<
    ValidationError[]
  >([]);
  const [validationInfos, setValidationInfos] = useState<ValidationError[]>(
    [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize form values from record detail
  useEffect(() => {
    if (recordDetail?.items) {
      const vals: Record<string, string> = {};
      for (const item of recordDetail.items) {
        vals[item.fieldCode] = item.finalValue ?? item.rawValue ?? "";
      }
      setFormValues(vals);
    }
  }, [recordDetail]);

  // Auto-save every 60 seconds
  useEffect(() => {
    if (!recordId) return;

    autoSaveTimerRef.current = setInterval(() => {
      void handleSave(true);
    }, 60000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [recordId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldChange = useCallback(
    (fieldCode: string, value: string) => {
      setFormValues((prev) => ({ ...prev, [fieldCode]: value }));
    },
    [],
  );

  const handleSave = useCallback(
    async (silent = false) => {
      if (!recordId) return;
      if (!silent) setIsSaving(true);

      try {
        const items = Object.entries(formValues).map(([fieldCode, rawValue]) => ({
          fieldCode,
          rawValue: rawValue || null,
        }));
        await saveRecord.mutateAsync({ items });
      } catch {
        // ignore silent save errors
      } finally {
        if (!silent) setIsSaving(false);
      }
    },
    [recordId, formValues, saveRecord],
  );

  const handleSubmit = useCallback(async () => {
    if (!recordId) return;
    setIsSubmitting(true);

    try {
      // Save first
      const items = Object.entries(formValues).map(([fieldCode, rawValue]) => ({
        fieldCode,
        rawValue: rawValue || null,
      }));
      await saveRecord.mutateAsync({ items });

      // Then submit
      const result = await submitRecord.mutateAsync();

      if (result.validation) {
        setValidationErrors(result.validation.errors || []);
        setValidationWarnings(result.validation.warnings || []);
        setValidationInfos(result.validation.infos || []);
      }
    } catch {
      // handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  }, [recordId, formValues, saveRecord, submitRecord]);

  const handleValidate = useCallback(async () => {
    if (!recordId) return;

    try {
      const result = await validateRecord.mutateAsync();
      setValidationErrors(result.errors || []);
      setValidationWarnings(result.warnings || []);
      setValidationInfos(result.infos || []);
    } catch {
      // handled by mutation
    }
  }, [recordId, validateRecord]);

  const handleCreateRecord = useCallback(async () => {
    if (!currentModule) return;
    try {
      await createRecord.mutateAsync({
        auditProjectId: "default-project",
        moduleCode,
      });
    } catch {
      // handled by mutation
    }
  }, [currentModule, moduleCode, createRecord]);

  if (fieldsLoading || recordLoading) return <Loading />;

  const fields = fieldsData?.fields ?? [];
  const moduleInfo = fieldsData?.module;
  const lockHolderId = recordDetail?.lockHolderId;
  const recordStatus =
    recordDetail?.status ?? currentModule?.recordStatus ?? "not_started";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/enterprise/filing"
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
              {moduleInfo?.name ?? moduleCode}
            </h1>
            <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
              {moduleInfo?.category ?? ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lockHolderId && (
            <Badge variant="warning">
              <Lock size={12} className="mr-1" />
              已锁定
            </Badge>
          )}
          <Badge
            variant={
              recordStatus === "submitted"
                ? "success"
                : recordStatus === "returned"
                  ? "danger"
                  : "default"
            }
          >
            {recordStatus === "not_started"
              ? "未开始"
              : recordStatus === "draft"
                ? "草稿"
                : recordStatus === "saved"
                  ? "已保存"
                  : recordStatus === "submitted"
                    ? "已提交"
                    : recordStatus === "returned"
                      ? "已退回"
                      : recordStatus}
          </Badge>
        </div>
      </div>

      {/* Return reason banner */}
      {recordStatus === "returned" && recordDetail && (
        <DataReturnBanner
          returnReason={recordDetail.returnReason ?? null}
          returnedBy={recordDetail.returnedBy ?? null}
          returnedAt={recordDetail.returnedAt ?? null}
        />
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-[hsl(var(--danger))]">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[hsl(var(--danger))]">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">
                校验错误 ({validationErrors.length})
              </span>
            </div>
            {validationErrors.map((err) => (
              <p
                key={err.ruleCode}
                className="text-sm text-[hsl(var(--danger))]"
              >
                {err.message}
              </p>
            ))}
          </div>
        </Card>
      )}

      {validationWarnings.length > 0 && (
        <Card className="border-[hsl(var(--warning))]">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[hsl(var(--warning))]">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">
                警告 ({validationWarnings.length})
              </span>
            </div>
            {validationWarnings.map((err) => (
              <p
                key={err.ruleCode}
                className="text-sm text-[hsl(var(--warning))]"
              >
                {err.message}
              </p>
            ))}
          </div>
        </Card>
      )}

      {validationInfos.length > 0 && (
        <Card>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-500">
              <Info size={16} />
              <span className="text-sm font-medium">
                提示 ({validationInfos.length})
              </span>
            </div>
            {validationInfos.map((err) => (
              <p key={err.ruleCode} className="text-sm text-blue-500">
                {err.message}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Form */}
      {!recordId && recordStatus === "not_started" ? (
        <Card>
          <CardHeader>
            <CardTitle>开始填报</CardTitle>
          </CardHeader>
          <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
            点击下方按钮创建数据记录，开始填写{" "}
            {moduleInfo?.name ?? moduleCode} 模块。
          </p>
          <Button onClick={handleCreateRecord}>创建数据记录</Button>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>数据填写</CardTitle>
          </CardHeader>
          {fields.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              该模块暂无字段配置，请联系管理员配置字段。
            </p>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => {
                const constraints = field.constraints as Record<
                  string,
                  unknown
                > | null;
                const isRequired = constraints?.required === true;
                const fieldError = validationErrors.find((e) =>
                  e.fieldCodes?.includes(field.code),
                );

                return (
                  <div key={field.code}>
                    <label className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">
                      {field.name}
                      {isRequired && (
                        <span className="ml-1 text-[hsl(var(--danger))]">
                          *
                        </span>
                      )}
                    </label>
                    {field.fieldType === "select" ? (
                      <Select
                        value={formValues[field.code] ?? ""}
                        onChange={(e) =>
                          handleFieldChange(field.code, e.target.value)
                        }
                        placeholder="请选择"
                        options={
                          (constraints?.options as Array<{
                            value: string;
                            label: string;
                          }>) ?? []
                        }
                      />
                    ) : (
                      <Input
                        type={field.fieldType === "number" ? "number" : "text"}
                        value={formValues[field.code] ?? ""}
                        onChange={(e) =>
                          handleFieldChange(field.code, e.target.value)
                        }
                        placeholder={
                          (
                            field.displayRules as Record<
                              string,
                              unknown
                            > | null
                          )?.placeholder as string | undefined
                        }
                        className={clsx(
                          fieldError && "border-[hsl(var(--danger))]",
                        )}
                      />
                    )}
                    {fieldError && (
                      <p className="mt-1 text-xs text-[hsl(var(--danger))]">
                        {fieldError.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-3 border-t border-[hsl(var(--border))] pt-4">
            <Button onClick={() => handleSave()} disabled={isSaving}>
              <Save size={16} className="mr-1" />
              {isSaving ? "保存中..." : "保存"}
            </Button>
            <Button
              onClick={handleValidate}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <CheckCircle2 size={16} className="mr-1" />
              校验
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[hsl(var(--success))] hover:opacity-90"
            >
              <Send size={16} className="mr-1" />
              {isSubmitting ? "提交中..." : "提交"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

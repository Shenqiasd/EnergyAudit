"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DataReturnBanner } from "@/components/data-return-dialog";
import { FormField } from "@/components/form/form-field";
import { FormGroup } from "@/components/form/form-group";
import { StickyActionBar } from "@/components/form/sticky-action-bar";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import {
  useCreateRecord,
  useDataModules,
  useDataRecord,
  useModuleFields,
  useSaveRecord,
  useSubmitRecord,
  useValidateRecord,
} from "@/lib/api/hooks/use-data-entry";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Info,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ValidationError } from "@/lib/api/hooks/use-data-entry";

interface ModuleRunnerPageProps {
  params: Promise<{ moduleCode: string }>;
}

function groupFields(
  fields: Array<{
    code: string;
    name: string;
    fieldType: string;
    constraints: Record<string, unknown> | null;
    displayRules: Record<string, unknown> | null;
    sortOrder: number;
  }>,
) {
  const groups: Record<string, typeof fields> = {};
  for (const field of fields) {
    const group = (field.displayRules?.group as string) ?? "\u57fa\u672c\u4fe1\u606f";
    if (!groups[group]) groups[group] = [];
    groups[group].push(field);
  }
  return groups;
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
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "saving" | "saved" | "error" | "idle"
  >("idle");
  const [autoSaveTime, setAutoSaveTime] = useState<string | undefined>();
  const [currentStep, setCurrentStep] = useState(0);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (recordDetail?.items) {
      const vals: Record<string, string> = {};
      for (const item of recordDetail.items) {
        vals[item.fieldCode] = item.finalValue ?? item.rawValue ?? "";
      }
      setFormValues(vals);
    }
  }, [recordDetail]);

  useEffect(() => {
    if (!recordId) return;

    autoSaveTimerRef.current = setInterval(() => {
      void handleAutoSave();
    }, 60000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [recordId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fields = fieldsData?.fields ?? [];
  const moduleInfo = fieldsData?.module;

  const fieldGroups = useMemo(() => groupFields(fields), [fields]);
  const groupNames = useMemo(() => Object.keys(fieldGroups), [fieldGroups]);
  const steps = useMemo(
    () =>
      groupNames.length > 0
        ? [...groupNames.map((name) => ({ label: name })), { label: "\u6c47\u603b" }]
        : [{ label: "\u6570\u636e\u586b\u5199" }, { label: "\u6c47\u603b" }],
    [groupNames],
  );

  const handleFieldChange = useCallback(
    (fieldCode: string, value: string) => {
      setFormValues((prev) => ({ ...prev, [fieldCode]: value }));
    },
    [],
  );

  const handleAutoSave = useCallback(async () => {
    if (!recordId) return;
    setAutoSaveStatus("saving");
    try {
      const items = Object.entries(formValues).map(([fieldCode, rawValue]) => ({
        fieldCode,
        rawValue: rawValue || null,
      }));
      await saveRecord.mutateAsync({ items });
      setAutoSaveStatus("saved");
      const now = new Date();
      setAutoSaveTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      );
    } catch {
      setAutoSaveStatus("error");
    }
  }, [recordId, formValues, saveRecord]);

  const handleSave = useCallback(async () => {
    if (!recordId) return;
    setIsSaving(true);
    try {
      const items = Object.entries(formValues).map(([fieldCode, rawValue]) => ({
        fieldCode,
        rawValue: rawValue || null,
      }));
      await saveRecord.mutateAsync({ items });
      setAutoSaveStatus("saved");
      const now = new Date();
      setAutoSaveTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      );
    } catch {
      // handled by mutation
    } finally {
      setIsSaving(false);
    }
  }, [recordId, formValues, saveRecord]);

  const handleSubmit = useCallback(async () => {
    if (!recordId) return;
    setIsSubmitting(true);

    try {
      const items = Object.entries(formValues).map(([fieldCode, rawValue]) => ({
        fieldCode,
        rawValue: rawValue || null,
      }));
      await saveRecord.mutateAsync({ items });

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

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  if (fieldsLoading || recordLoading) return <Loading />;

  const lockHolderId = recordDetail?.lockHolderId;
  const recordStatus =
    recordDetail?.status ?? currentModule?.recordStatus ?? "not_started";

  const getGroupCompletion = (groupName: string): "complete" | "incomplete" | "error" => {
    const groupFieldList = fieldGroups[groupName] ?? [];
    const hasError = groupFieldList.some((f) =>
      validationErrors.some((e) => e.fieldCodes?.includes(f.code)),
    );
    if (hasError) return "error";

    const allFilled = groupFieldList.every((f) => {
      const constraints = f.constraints as Record<string, unknown> | null;
      if (constraints?.required !== true) return true;
      return !!formValues[f.code];
    });
    return allFilled ? "complete" : "incomplete";
  };

  const isSummaryStep = currentStep === steps.length - 1;

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
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Step {currentStep + 1} of {steps.length}
          </span>
          {lockHolderId && (
            <Badge variant="warning">
              <Lock size={12} className="mr-1" />
              {"\u5df2\u9501\u5b9a"}
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
              ? "\u672a\u5f00\u59cb"
              : recordStatus === "draft"
                ? "\u8349\u7a3f"
                : recordStatus === "saved"
                  ? "\u5df2\u4fdd\u5b58"
                  : recordStatus === "submitted"
                    ? "\u5df2\u63d0\u4ea4"
                    : recordStatus === "returned"
                      ? "\u5df2\u9000\u56de"
                      : recordStatus}
          </Badge>
        </div>
      </div>

      {recordStatus === "returned" && recordDetail && (
        <DataReturnBanner
          returnReason={recordDetail.returnReason ?? null}
          returnedBy={recordDetail.returnedBy ?? null}
          returnedAt={recordDetail.returnedAt ?? null}
        />
      )}

      <Stepper
        steps={steps}
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
      />

      {validationErrors.length > 0 && (
        <Card className="border-[hsl(var(--danger))]">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[hsl(var(--danger))]">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">
                {"\u6821\u9a8c\u9519\u8bef"} ({validationErrors.length})
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
                {"\u8b66\u544a"} ({validationWarnings.length})
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
                {"\u63d0\u793a"} ({validationInfos.length})
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

      {!recordId && recordStatus === "not_started" ? (
        <Card>
          <CardHeader>
            <CardTitle>{"\u5f00\u59cb\u586b\u62a5"}</CardTitle>
          </CardHeader>
          <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
            {"\u70b9\u51fb\u4e0b\u65b9\u6309\u94ae\u521b\u5efa\u6570\u636e\u8bb0\u5f55\uff0c\u5f00\u59cb\u586b\u5199"}{" "}
            {moduleInfo?.name ?? moduleCode} {"\u6a21\u5757\u3002"}
          </p>
          <Button onClick={handleCreateRecord}>{"\u521b\u5efa\u6570\u636e\u8bb0\u5f55"}</Button>
        </Card>
      ) : isSummaryStep ? (
        <div className="space-y-4">
          {groupNames.map((groupName) => {
            const groupFieldList = fieldGroups[groupName] ?? [];
            const completion = getGroupCompletion(groupName);

            return (
              <FormGroup
                key={groupName}
                title={groupName}
                completionStatus={completion}
                defaultOpen={false}
              >
                <div className="space-y-3">
                  {groupFieldList.map((field) => {
                    const val = formValues[field.code];
                    return (
                      <div
                        key={field.code}
                        className="flex items-center justify-between border-b border-[hsl(var(--border))] py-2 last:border-b-0"
                      >
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">
                          {field.name}
                        </span>
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                          {val || "\u2014"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </FormGroup>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {groupNames.length > 0 ? (
            groupNames
              .filter((_, idx) =>
                groupNames.length === 1 ? true : idx === currentStep,
              )
              .map((groupName) => {
                const groupFieldList = fieldGroups[groupName] ?? [];
                const completion = getGroupCompletion(groupName);

                return (
                  <FormGroup
                    key={groupName}
                    title={groupName}
                    completionStatus={completion}
                    defaultOpen={true}
                  >
                    <div className="space-y-4">
                      {groupFieldList.map((field) => {
                        const constraints = field.constraints as Record<
                          string,
                          unknown
                        > | null;
                        const isRequired = constraints?.required === true;
                        const fieldError = validationErrors.find((e) =>
                          e.fieldCodes?.includes(field.code),
                        );
                        const displayRules = field.displayRules as Record<
                          string,
                          unknown
                        > | null;
                        const suffix = displayRules?.unit as string | undefined;

                        return (
                          <FormField
                            key={field.code}
                            label={field.name}
                            required={isRequired}
                            error={fieldError?.message}
                            suffix={suffix}
                          >
                            {field.fieldType === "select" ? (
                              <Select
                                value={formValues[field.code] ?? ""}
                                onChange={(e) =>
                                  handleFieldChange(
                                    field.code,
                                    e.target.value,
                                  )
                                }
                                placeholder={"\u8bf7\u9009\u62e9"}
                                options={
                                  (constraints?.options as Array<{
                                    value: string;
                                    label: string;
                                  }>) ?? []
                                }
                              />
                            ) : (
                              <Input
                                type={
                                  field.fieldType === "number"
                                    ? "number"
                                    : "text"
                                }
                                value={formValues[field.code] ?? ""}
                                onChange={(e) =>
                                  handleFieldChange(
                                    field.code,
                                    e.target.value,
                                  )
                                }
                                placeholder={
                                  displayRules?.placeholder as
                                    | string
                                    | undefined
                                }
                              />
                            )}
                          </FormField>
                        );
                      })}
                    </div>
                  </FormGroup>
                );
              })
          ) : (
            <Card>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {"\u8be5\u6a21\u5757\u6682\u65e0\u5b57\u6bb5\u914d\u7f6e\uff0c\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458\u914d\u7f6e\u5b57\u6bb5\u3002"}
              </p>
            </Card>
          )}
        </div>
      )}

      {recordId && (
        <StickyActionBar
          autoSaveStatus={autoSaveStatus}
          autoSaveTime={autoSaveTime}
          onSaveDraft={handleSave}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isFirstStep={currentStep === 0}
          isLastStep={isSummaryStep}
          loading={isSaving || isSubmitting}
        />
      )}
    </div>
  );
}

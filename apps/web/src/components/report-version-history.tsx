"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import {
  useReportVersions,
  useCompareVersions,
  useActivateVersion,
} from "@/lib/api/hooks/use-reports";
import { CheckCircle, Clock, Download, GitCompare } from "lucide-react";

const VERSION_TYPE_LABELS: Record<string, string> = {
  system_draft: "系统草稿",
  enterprise_revision: "企业修订",
  final: "终版",
};

interface ReportVersionHistoryProps {
  reportId: string;
}

export function ReportVersionHistory({ reportId }: ReportVersionHistoryProps) {
  const { data: versions } = useReportVersions(reportId);
  const activateVersion = useActivateVersion(reportId);
  const [compareIds, setCompareIds] = useState<{ v1: string; v2: string } | null>(null);

  const handleActivate = async (versionId: string) => {
    await activateVersion.mutateAsync(versionId);
  };

  if (!versions || versions.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Clock size={18} />
              版本历史
            </span>
          </CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {versions.map((v, idx) => (
            <div
              key={v.id}
              className={`flex items-center justify-between rounded-lg border p-3 ${
                v.isActive
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                  : "border-[hsl(var(--border))]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-sm font-medium">
                    {VERSION_TYPE_LABELS[v.versionType] ?? v.versionType}{" "}
                    v{v.versionNumber}
                  </span>
                  {v.isActive && (
                    <Badge variant="success" className="ml-2">
                      当前版本
                    </Badge>
                  )}
                  <div className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                    {new Date(v.createdAt).toLocaleString("zh-CN")}
                    {v.createdBy && ` · ${v.createdBy}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {v.fileUrl && (
                  <Button variant="ghost" size="sm">
                    <Download size={14} />
                  </Button>
                )}
                {!v.isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleActivate(v.id)}
                    disabled={activateVersion.isPending}
                    title="设为当前版本"
                  >
                    <CheckCircle size={14} />
                  </Button>
                )}
                {idx < versions.length - 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCompareIds({ v1: versions[idx + 1].id, v2: v.id })
                    }
                    title="与上一版本比较"
                  >
                    <GitCompare size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {compareIds && (
        <VersionCompareModal
          reportId={reportId}
          v1={compareIds.v1}
          v2={compareIds.v2}
          onClose={() => setCompareIds(null)}
        />
      )}
    </>
  );
}

function VersionCompareModal({
  reportId,
  v1,
  v2,
  onClose,
}: {
  reportId: string;
  v1: string;
  v2: string;
  onClose: () => void;
}) {
  const { data: comparison, isLoading } = useCompareVersions(reportId, v1, v2);

  return (
    <Modal open onClose={onClose} title="版本对比" className="max-w-2xl">
      {isLoading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">加载中...</p>
      ) : !comparison ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">无法加载对比数据</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>
              v{comparison.version1.versionNumber} vs v{comparison.version2.versionNumber}
            </span>
            <span className="text-[hsl(var(--muted-foreground))]">
              {comparison.changedSections}/{comparison.totalSections} 个章节有变更
            </span>
          </div>

          <div className="max-h-96 space-y-3 overflow-y-auto">
            {comparison.diffs.map((diff) => (
              <div
                key={diff.sectionCode}
                className={`rounded-lg border p-3 ${
                  diff.changed
                    ? "border-[hsl(var(--warning))] bg-yellow-50"
                    : "border-[hsl(var(--border))]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{diff.sectionName}</span>
                  {diff.changed ? (
                    <Badge variant="warning">已变更</Badge>
                  ) : (
                    <Badge variant="default">无变更</Badge>
                  )}
                </div>
                {diff.changed && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-red-50 p-2">
                      <div className="mb-1 font-medium text-red-600">
                        v{comparison.version1.versionNumber}
                      </div>
                      <div className="whitespace-pre-wrap text-[hsl(var(--muted-foreground))]">
                        {diff.v1Content ?? "（无内容）"}
                      </div>
                    </div>
                    <div className="rounded bg-green-50 p-2">
                      <div className="mb-1 font-medium text-green-600">
                        v{comparison.version2.versionNumber}
                      </div>
                      <div className="whitespace-pre-wrap text-[hsl(var(--muted-foreground))]">
                        {diff.v2Content ?? "（无内容）"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

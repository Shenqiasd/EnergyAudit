"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useEnterpriseProfile } from "@/lib/api/hooks/use-audit-projects";
import { Building2, Info } from "lucide-react";

interface EnterpriseProfileCardProps {
  projectId: string;
}

export function EnterpriseProfileCard({ projectId }: EnterpriseProfileCardProps) {
  const { data: profile, isLoading } = useEnterpriseProfile(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Building2 size={18} />
              企业信息快照
            </span>
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--color-text-secondary)]">加载中...</p>
      </Card>
    );
  }

  if (!profile) return null;

  const fields = [
    { label: "企业名称", value: profile.name },
    { label: "统一社会信用代码", value: profile.unifiedSocialCreditCode },
    { label: "行业代码", value: profile.industryCode },
    { label: "联系人", value: profile.contactPerson },
    { label: "联系电话", value: profile.contactPhone },
    { label: "联系邮箱", value: profile.contactEmail },
    { label: "地址", value: profile.address },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Building2 size={18} />
            企业信息快照
          </span>
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {fields.map(
          (f) =>
            f.value && (
              <div key={f.label}>
                <span className="text-[var(--color-text-secondary)]">{f.label}：</span>
                <span className="text-[var(--color-text)]">{f.value}</span>
              </div>
            ),
        )}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          企业信息快照于 {new Date(profile.snapshotAt).toLocaleString("zh-CN")}，反映项目创建时的企业状态
        </span>
      </div>
    </Card>
  );
}

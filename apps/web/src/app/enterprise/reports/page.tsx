import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function EnterpriseReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">报告管理</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          查看和管理审计报告，上传终版报告
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <FileText size={20} />
              功能建设中
            </span>
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--color-text-secondary)]">
          报告管理页面将包括：报告草稿查看、企业修订、终版报告上传、报告状态跟踪、历史报告归档等功能模块。
        </p>
      </Card>
    </div>
  );
}

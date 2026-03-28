import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function ManagerEnterprisesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">企业管理</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          管理参与审计的企业信息、准入状态和企业账号
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Building2 size={20} />
              功能建设中
            </span>
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--color-text-secondary)]">
          企业管理页面将包括：企业列表、准入审核、企业详情查看、企业状态变更、批量导入等功能模块。
        </p>
      </Card>
    </div>
  );
}

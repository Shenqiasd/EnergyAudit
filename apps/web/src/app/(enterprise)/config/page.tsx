import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function EnterpriseConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">企业配置</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          管理企业基本信息、联系人、用能设备等配置
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Settings size={20} />
              功能建设中
            </span>
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--color-text-secondary)]">
          企业配置页面将包括：企业基本信息管理、用能设备清单、联系人信息维护、企业准入状态查看等功能模块。
        </p>
      </Card>
    </div>
  );
}

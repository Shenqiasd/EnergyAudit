import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export default function EnterpriseRectificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">整改任务</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          查看审核发现的问题，提交整改方案和完成情况
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Wrench size={20} />
              功能建设中
            </span>
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--color-text-secondary)]">
          整改任务页面将包括：整改问题列表、整改方案提交、整改进度跟踪、验收状态查看等功能模块。
        </p>
      </Card>
    </div>
  );
}

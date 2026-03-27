import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

export default function ReviewerHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">审核历史</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          查看已完成的审核记录和历史评分
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <History size={20} />
              功能建设中
            </span>
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--color-text-secondary)]">
          审核历史页面将包括：已完成审核列表、审核详情查看、评分记录、问题跟踪回顾等功能模块。
        </p>
      </Card>
    </div>
  );
}

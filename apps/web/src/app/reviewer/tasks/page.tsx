import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

export default function ReviewerTasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">我的审核</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          查看分配给我的审核任务，进行审核评分
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <ListChecks size={20} />
              功能建设中
            </span>
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--color-text-secondary)]">
          我的审核页面将包括：待审核任务列表、审核评分表、问题录入、审核意见提交、退回操作等功能模块。
        </p>
      </Card>
    </div>
  );
}

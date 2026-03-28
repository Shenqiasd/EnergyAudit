"use client";

import { useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { useReviewTasks } from "@/lib/api/hooks/use-reviews";

export default function ReviewerHistoryPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useReviewTasks({
    status: "completed",
  });

  const filteredItems = data?.items.filter((task) =>
    search ? task.auditProjectId.includes(search) || task.id.includes(search) : true
  ) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">审核历史</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          查看已完成的审核记录和历史评分
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索项目 ID..."
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <Loading />
      ) : !filteredItems.length ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <History size={20} />
                暂无历史记录
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((task) => (
            <Link key={task.id} href={`/reviewer/tasks/${task.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text)]">
                        审核任务
                      </span>
                      <Badge variant="success">已完成</Badge>
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      项目 ID: {task.auditProjectId}
                    </div>
                    {task.totalScore && (
                      <div className="text-sm text-[var(--color-text-secondary)]">
                        总分: {task.totalScore}
                      </div>
                    )}
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      完成时间: {task.completedAt ? new Date(task.completedAt).toLocaleDateString("zh-CN") : "-"}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

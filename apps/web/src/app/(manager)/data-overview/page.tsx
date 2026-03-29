"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loading } from "@/components/ui/loading";
import { ImportRollbackDialog } from "@/components/data-entry/import-rollback-dialog";
import { useCanRollback } from "@/lib/api/hooks/use-import-rollback";
import { useDataRecords } from "@/lib/api/hooks/use-data-entry";
import { useAuth } from "@/lib/auth/use-auth";
import { RotateCcw, FileUp } from "lucide-react";

interface ImportJobRow {
  id: string;
  auditProjectId: string;
  moduleCode: string;
  status: string;
  totalRows: number | null;
  successRows: number | null;
  failedRows: number | null;
  createdAt: string;
  isRolledBack: boolean;
  rolledBackAt: string | null;
}

function RollbackStatusBadge({ job }: { job: ImportJobRow }) {
  if (job.isRolledBack) {
    return <Badge variant="default">已回滚</Badge>;
  }
  return null;
}

function RollbackAction({
  job,
  userId,
  onRollbackClick,
}: {
  job: ImportJobRow;
  userId: string;
  onRollbackClick: (jobId: string, moduleCode: string) => void;
}) {
  const { data: rollbackCheck } = useCanRollback(job.id);

  if (job.isRolledBack) {
    return (
      <span className="text-xs text-[var(--color-text-secondary)]">
        已回滚 ({job.rolledBackAt ? new Date(job.rolledBackAt).toLocaleDateString() : ""})
      </span>
    );
  }

  if (!rollbackCheck?.canRollback) {
    return (
      <span className="text-xs text-[var(--color-text-secondary)]">
        {rollbackCheck?.reason ?? "不可回滚"}
      </span>
    );
  }

  return (
    <Button
      size="sm"
      variant="danger"
      onClick={() => onRollbackClick(job.id, job.moduleCode)}
    >
      <RotateCcw size={14} />
      回滚
    </Button>
  );
}

export default function DataOverviewPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const { data: recordsData, isLoading } = useDataRecords({ pageSize: 50 });

  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedModuleCode, setSelectedModuleCode] = useState("");

  // Mock import jobs for display — in production these would come from a dedicated API
  const [importJobs] = useState<ImportJobRow[]>([]);

  const handleRollbackClick = (jobId: string, moduleCode: string) => {
    setSelectedJobId(jobId);
    setSelectedModuleCode(moduleCode);
    setRollbackDialogOpen(true);
  };

  const handleRollbackSuccess = () => {
    setRollbackDialogOpen(false);
    setSelectedJobId("");
    setSelectedModuleCode("");
  };

  if (isLoading) {
    return <Loading size={32} text="加载数据概览..." className="min-h-[400px]" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">数据概览</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          查看数据记录状态和导入历史，支持导入回滚操作
        </p>
      </div>

      {/* Data Records Overview */}
      <Card>
        <CardHeader>
          <CardTitle>数据记录</CardTitle>
          <Badge variant="default">{recordsData?.total ?? 0} 条记录</Badge>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>模块</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>更新时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recordsData?.items.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.moduleCode}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      record.status === "submitted"
                        ? "success"
                        : record.status === "draft"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {record.status === "draft"
                      ? "草稿"
                      : record.status === "submitted"
                        ? "已提交"
                        : record.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-[var(--color-text-secondary)]">
                  {new Date(record.updatedAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {(!recordsData?.items || recordsData.items.length === 0) && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
                  暂无数据记录
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Import History with Rollback */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileUp size={18} className="text-[var(--color-primary)]" />
            <CardTitle>导入历史</CardTitle>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>导入任务</TableHead>
              <TableHead>模块</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>行数</TableHead>
              <TableHead>导入时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {importJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-xs">{job.id}</TableCell>
                <TableCell>{job.moduleCode}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        job.status === "completed"
                          ? "success"
                          : job.status === "failed"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {job.status === "completed"
                        ? "完成"
                        : job.status === "failed"
                          ? "失败"
                          : job.status}
                    </Badge>
                    <RollbackStatusBadge job={job} />
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {job.successRows ?? 0}/{job.totalRows ?? 0}
                  {(job.failedRows ?? 0) > 0 && (
                    <span className="ml-1 text-red-500">
                      ({job.failedRows} 失败)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-[var(--color-text-secondary)]">
                  {new Date(job.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <RollbackAction
                    job={job}
                    userId={userId}
                    onRollbackClick={handleRollbackClick}
                  />
                </TableCell>
              </TableRow>
            ))}
            {importJobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
                  暂无导入记录
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Rollback Dialog */}
      <ImportRollbackDialog
        open={rollbackDialogOpen}
        onClose={() => setRollbackDialogOpen(false)}
        importJobId={selectedJobId}
        userId={userId}
        moduleCode={selectedModuleCode}
        onSuccess={handleRollbackSuccess}
      />
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Cpu, Play } from "lucide-react";

interface ProjectCalcStatus {
  projectId: string;
  projectName: string;
  enterpriseName: string;
  batchName: string;
  hasSnapshot: boolean;
  lastCalculatedAt: string | null;
  totalTce: number | null;
  totalCarbon: number | null;
}

export default function ManagerCalculationsPage() {
  // Placeholder data - will be populated from API when projects are available
  const projects: ProjectCalcStatus[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">计算管理</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          管理各项目的能耗计算、碳排放核算和标杆对比
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2 text-base">
                <Cpu size={18} className="text-[hsl(var(--primary))]" />
                项目总数
              </span>
            </CardTitle>
          </CardHeader>
          <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
            {projects.length}
          </p>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2 text-base">
                <BarChart3 size={18} className="text-[hsl(var(--success))]" />
                已计算
              </span>
            </CardTitle>
          </CardHeader>
          <p className="text-3xl font-bold text-[hsl(var(--success))]">
            {projects.filter((p) => p.hasSnapshot).length}
          </p>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2 text-base">
                <Play size={18} className="text-[hsl(var(--warning))]" />
                待计算
              </span>
            </CardTitle>
          </CardHeader>
          <p className="text-3xl font-bold text-[hsl(var(--warning))]">
            {projects.filter((p) => !p.hasSnapshot).length}
          </p>
        </Card>
      </div>

      {/* Project calculation table */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Cpu size={20} />
              项目计算状态
            </span>
          </CardTitle>
        </CardHeader>

        {projects.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            暂无项目数据。请先在项目管理中创建审计项目。
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>企业名称</TableHead>
                <TableHead>批次</TableHead>
                <TableHead>计算状态</TableHead>
                <TableHead>综合能耗(tce)</TableHead>
                <TableHead>碳排放(tCO2e)</TableHead>
                <TableHead>最后计算</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.projectId}>
                  <TableCell className="font-medium">
                    {project.enterpriseName}
                  </TableCell>
                  <TableCell>{project.batchName}</TableCell>
                  <TableCell>
                    <Badge
                      variant={project.hasSnapshot ? "success" : "warning"}
                    >
                      {project.hasSnapshot ? "已计算" : "待计算"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {project.totalTce?.toFixed(2) ?? "-"}
                  </TableCell>
                  <TableCell>
                    {project.totalCarbon?.toFixed(2) ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                    {project.lastCalculatedAt
                      ? new Date(project.lastCalculatedAt).toLocaleString("zh-CN")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="secondary">
                      <Play size={14} />
                      执行计算
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';
import { ReportVersionService } from './report-version.service';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

interface SectionTemplate {
  code: string;
  name: string;
  sortOrder: number;
  chartCodes: string[];
}

const STANDARD_SECTIONS: SectionTemplate[] = [
  { code: 'enterprise-overview', name: '企业概况', sortOrder: 1, chartCodes: [] },
  { code: 'energy-consumption', name: '能源消费', sortOrder: 2, chartCodes: ['energy-structure-pie', 'energy-trend-bar'] },
  { code: 'energy-efficiency', name: '能效分析', sortOrder: 3, chartCodes: ['product-energy-comparison-bar'] },
  { code: 'carbon-emission', name: '碳排放', sortOrder: 4, chartCodes: ['carbon-emission-pie'] },
  { code: 'product-energy', name: '产品能耗', sortOrder: 5, chartCodes: ['product-energy-comparison-bar'] },
  { code: 'energy-saving', name: '节能措施', sortOrder: 6, chartCodes: [] },
  { code: 'energy-flow', name: '能源流程', sortOrder: 7, chartCodes: ['energy-flow-sankey'] },
  { code: 'audit-conclusion', name: '审计结论', sortOrder: 8, chartCodes: [] },
];

@Injectable()
export class ReportAssemblyService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly versionService: ReportVersionService,
  ) {}

  async generateReport(projectId: string, createdBy?: string) {
    const [project] = await this.db
      .select()
      .from(schema.auditProjects)
      .where(eq(schema.auditProjects.id, projectId))
      .limit(1);

    if (!project) {
      throw new Error('项目不存在');
    }

    // Check for existing report
    const [existingReport] = await this.db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.auditProjectId, projectId))
      .limit(1);

    let reportId: string;
    if (existingReport) {
      reportId = existingReport.id;
      // Update existing report
      await this.db
        .update(schema.reports)
        .set({
          status: 'system_draft',
          generatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.reports.id, reportId));

      // Delete old current sections only (preserve version snapshots)
      await this.db
        .delete(schema.reportSections)
        .where(and(eq(schema.reportSections.reportId, reportId), isNull(schema.reportSections.reportVersionId)));
    } else {
      reportId = `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await this.db.insert(schema.reports).values({
        id: reportId,
        auditProjectId: projectId,
        version: 1,
        versionType: 'system_draft',
        status: 'system_draft',
        templateVersionId: project.templateVersionId,
        generatedAt: new Date(),
      });
    }

    // Get calculation snapshot
    const [snapshot] = await this.db
      .select()
      .from(schema.calculationSnapshots)
      .where(
        and(
          eq(schema.calculationSnapshots.auditProjectId, projectId),
          eq(schema.calculationSnapshots.isLatest, true),
        ),
      )
      .limit(1);

    // Get chart outputs
    const chartOutputs = await this.db
      .select()
      .from(schema.chartOutputs)
      .where(eq(schema.chartOutputs.auditProjectId, projectId));

    const chartMap = new Map(chartOutputs.map((c) => [c.chartConfigCode, c]));

    // Get data records for content assembly
    const records = await this.db
      .select()
      .from(schema.dataRecords)
      .where(eq(schema.dataRecords.auditProjectId, projectId));

    const allItems: Array<{ fieldCode: string; finalValue: string | null; rawValue: string | null }> = [];
    for (const record of records) {
      const items = await this.db
        .select()
        .from(schema.dataItems)
        .where(eq(schema.dataItems.dataRecordId, record.id));
      allItems.push(...items.map((i) => ({
        fieldCode: i.fieldCode,
        finalValue: i.finalValue,
        rawValue: i.rawValue,
      })));
    }

    // Build sections
    for (const section of STANDARD_SECTIONS) {
      const sectionId = `rs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${section.sortOrder}`;

      const content = this.buildSectionContent(section.code, allItems, snapshot);
      const charts = section.chartCodes
        .map((code) => {
          const chart = chartMap.get(code);
          if (!chart) return null;
          return { chartCode: code, chartType: chart.chartType, title: chart.title };
        })
        .filter((c): c is { chartCode: string; chartType: string; title: string } => c !== null);

      await this.db.insert(schema.reportSections).values({
        id: sectionId,
        reportId,
        sectionCode: section.code,
        sectionName: section.name,
        sortOrder: section.sortOrder,
        content,
        charts: charts.length > 0 ? charts : null,
      });
    }

    // Create version record with section snapshots
    await this.versionService.createVersion(reportId, 'system_draft', undefined, createdBy);

    return { reportId, status: 'system_draft', sectionsCount: STANDARD_SECTIONS.length };
  }

  private buildSectionContent(
    sectionCode: string,
    items: Array<{ fieldCode: string; finalValue: string | null; rawValue: string | null }>,
    snapshot: typeof schema.calculationSnapshots.$inferSelect | undefined,
  ): string {
    const getValue = (fieldCode: string): string => {
      const item = items.find((i) => i.fieldCode === fieldCode);
      if (!item) return '暂无数据';
      return item.finalValue ?? item.rawValue ?? '暂无数据';
    };

    switch (sectionCode) {
      case 'enterprise-overview':
        return `企业名称：${getValue('enterprise_name')}\n行业代码：${getValue('industry_code')}\n地址：${getValue('address')}`;
      case 'energy-consumption': {
        const snapshotResult = snapshot ? (JSON.parse(snapshot.result) as Record<string, unknown>) : null;
        const energy = snapshotResult?.['comprehensiveEnergy'] as { totalTce?: number } | undefined;
        const totalTce = energy?.totalTce ?? 0;
        return `综合能耗：${totalTce.toFixed(2)} tce\n煤炭消费：${getValue('coal_consumption')}\n电力消费：${getValue('electricity_consumption')}\n天然气消费：${getValue('natural_gas_consumption')}`;
      }
      case 'energy-efficiency': {
        const snapshotResult = snapshot ? (JSON.parse(snapshot.result) as Record<string, unknown>) : null;
        const intensity = snapshotResult?.['energyIntensity'] as { intensityPerOutput?: number } | undefined;
        return `单位产值能耗：${(intensity?.intensityPerOutput ?? 0).toFixed(4)} tce/万元`;
      }
      case 'carbon-emission': {
        const snapshotResult = snapshot ? (JSON.parse(snapshot.result) as Record<string, unknown>) : null;
        const carbon = snapshotResult?.['carbonEmission'] as { totalEmission?: number } | undefined;
        return `碳排放总量：${(carbon?.totalEmission ?? 0).toFixed(2)} tCO2e`;
      }
      case 'product-energy':
        return '产品能耗分析详见图表。';
      case 'energy-saving':
        return '节能措施建议将在审计完成后补充。';
      case 'energy-flow':
        return '能源流向详见桑基图。';
      case 'audit-conclusion':
        return '审计结论将在审核通过后生成。';
      default:
        return '';
    }
  }
}

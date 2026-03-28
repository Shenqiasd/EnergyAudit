import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';
import { DEFAULT_CHART_CONFIGS } from './chart-config';
import { EnergyFlowService } from './energy-flow.service';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface ChartOutput {
  chartCode: string;
  chartType: string;
  title: string;
  data: unknown;
}

@Injectable()
export class ChartService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly energyFlowService: EnergyFlowService,
  ) {}

  async listCharts(projectId: string): Promise<ChartOutput[]> {
    const existing = await this.db
      .select()
      .from(schema.chartOutputs)
      .where(eq(schema.chartOutputs.auditProjectId, projectId));

    return existing.map((c) => ({
      chartCode: c.chartConfigCode,
      chartType: c.chartType,
      title: c.title,
      data: JSON.parse(c.data) as unknown,
    }));
  }

  async getChart(projectId: string, chartCode: string): Promise<ChartOutput | null> {
    const [existing] = await this.db
      .select()
      .from(schema.chartOutputs)
      .where(
        and(
          eq(schema.chartOutputs.auditProjectId, projectId),
          eq(schema.chartOutputs.chartConfigCode, chartCode),
        ),
      )
      .limit(1);

    if (!existing) return null;

    return {
      chartCode: existing.chartConfigCode,
      chartType: existing.chartType,
      title: existing.title,
      data: JSON.parse(existing.data) as unknown,
    };
  }

  async generateCharts(projectId: string): Promise<ChartOutput[]> {
    const records = await this.db
      .select()
      .from(schema.dataRecords)
      .where(eq(schema.dataRecords.auditProjectId, projectId));

    // Collect all data items
    const allItems: Array<{
      fieldCode: string;
      finalValue: string | null;
      rawValue: string | null;
    }> = [];

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

    const outputs: ChartOutput[] = [];

    for (const config of DEFAULT_CHART_CONFIGS) {
      let chartData: unknown;

      if (config.chartType === 'sankey') {
        chartData = await this.energyFlowService.buildSankeyDiagram(projectId);
      } else {
        chartData = this.buildChartData(config.code, allItems);
      }

      // Upsert chart output
      const [existing] = await this.db
        .select()
        .from(schema.chartOutputs)
        .where(
          and(
            eq(schema.chartOutputs.auditProjectId, projectId),
            eq(schema.chartOutputs.chartConfigCode, config.code),
          ),
        )
        .limit(1);

      const chartId = existing?.id ?? `co_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      if (existing) {
        await this.db
          .update(schema.chartOutputs)
          .set({ data: JSON.stringify(chartData) })
          .where(eq(schema.chartOutputs.id, existing.id));
      } else {
        await this.db.insert(schema.chartOutputs).values({
          id: chartId,
          auditProjectId: projectId,
          chartConfigCode: config.code,
          chartType: config.chartType,
          title: config.name,
          data: JSON.stringify(chartData),
          isMandatory: true,
          embeddedInReport: false,
        });
      }

      outputs.push({
        chartCode: config.code,
        chartType: config.chartType,
        title: config.name,
        data: chartData,
      });
    }

    return outputs;
  }

  private buildChartData(
    chartCode: string,
    items: Array<{ fieldCode: string; finalValue: string | null; rawValue: string | null }>,
  ): unknown {
    const getValue = (fieldCode: string): number => {
      const item = items.find((i) => i.fieldCode === fieldCode);
      if (!item) return 0;
      const val = item.finalValue ?? item.rawValue;
      if (val === null || val === '') return 0;
      const num = Number(val);
      return isFinite(num) ? num : 0;
    };

    switch (chartCode) {
      case 'energy-structure-pie': {
        const entries = [
          { label: '煤炭', value: getValue('coal_consumption') },
          { label: '电力', value: getValue('electricity_consumption') },
          { label: '天然气', value: getValue('natural_gas_consumption') },
          { label: '石油', value: getValue('oil_consumption') },
          { label: '热力', value: getValue('heat_consumption') },
        ].filter((e) => e.value > 0);
        return { type: 'pie', title: '能源消费结构', data: entries };
      }
      case 'energy-trend-bar': {
        const total = getValue('total_energy_consumption');
        return { type: 'bar', title: '能源消费趋势', data: [{ label: '当年', value: total }] };
      }
      case 'carbon-emission-pie': {
        const entries = [
          { label: '煤炭', value: getValue('coal_carbon_emission') },
          { label: '电力', value: getValue('electricity_carbon_emission') },
          { label: '天然气', value: getValue('natural_gas_carbon_emission') },
          { label: '石油', value: getValue('oil_carbon_emission') },
        ].filter((e) => e.value > 0);
        return { type: 'pie', title: '碳排放构成', data: entries };
      }
      case 'product-energy-comparison-bar': {
        return { type: 'bar', title: '产品单位能耗对比', data: [] };
      }
      default:
        return { type: 'unknown', data: [] };
    }
  }
}

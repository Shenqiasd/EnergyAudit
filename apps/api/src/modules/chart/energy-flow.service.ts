import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface SankeyNode {
  id: string;
  name: string;
  category: 'source' | 'transformation' | 'end_use';
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyDiagramData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

@Injectable()
export class EnergyFlowService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async buildSankeyDiagram(projectId: string): Promise<SankeyDiagramData> {
    // Get energy balance data records
    const records = await this.db
      .select()
      .from(schema.dataRecords)
      .where(eq(schema.dataRecords.auditProjectId, projectId));

    const energyBalanceRecord = records.find((r) => r.moduleCode === 'energy-balance');
    const energyFlowRecord = records.find((r) => r.moduleCode === 'energy-flow');

    const dataItems: Array<{ fieldCode: string; finalValue: string | null; rawValue: string | null }> = [];

    if (energyBalanceRecord) {
      const items = await this.db
        .select()
        .from(schema.dataItems)
        .where(eq(schema.dataItems.dataRecordId, energyBalanceRecord.id));
      dataItems.push(...items.map((i) => ({
        fieldCode: i.fieldCode,
        finalValue: i.finalValue,
        rawValue: i.rawValue,
      })));
    }

    if (energyFlowRecord) {
      const items = await this.db
        .select()
        .from(schema.dataItems)
        .where(eq(schema.dataItems.dataRecordId, energyFlowRecord.id));
      dataItems.push(...items.map((i) => ({
        fieldCode: i.fieldCode,
        finalValue: i.finalValue,
        rawValue: i.rawValue,
      })));
    }

    return this.buildFromDataItems(dataItems);
  }

  private buildFromDataItems(
    items: Array<{ fieldCode: string; finalValue: string | null; rawValue: string | null }>,
  ): SankeyDiagramData {
    const getValue = (fieldCode: string): number => {
      const item = items.find((i) => i.fieldCode === fieldCode);
      if (!item) return 0;
      const val = item.finalValue ?? item.rawValue;
      if (val === null || val === '') return 0;
      const num = Number(val);
      return isFinite(num) ? num : 0;
    };

    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Source nodes
    const energySources: Array<{ id: string; name: string; field: string }> = [
      { id: 'coal', name: '煤炭', field: 'coal_consumption' },
      { id: 'electricity', name: '电力', field: 'electricity_consumption' },
      { id: 'natural-gas', name: '天然气', field: 'natural_gas_consumption' },
      { id: 'oil', name: '石油', field: 'oil_consumption' },
      { id: 'heat', name: '热力', field: 'heat_consumption' },
    ];

    let totalInput = 0;
    for (const source of energySources) {
      const value = getValue(source.field);
      if (value > 0) {
        nodes.push({ id: source.id, name: source.name, category: 'source' });
        totalInput += value;
      }
    }

    if (totalInput === 0) {
      return { nodes: [], links: [] };
    }

    // Distribution node
    nodes.push({ id: 'distribution', name: '能源分配', category: 'transformation' });

    // Add source -> distribution links
    for (const source of energySources) {
      const value = getValue(source.field);
      if (value > 0) {
        links.push({ source: source.id, target: 'distribution', value });
      }
    }

    // End use nodes
    const endUses: Array<{ id: string; name: string; field: string }> = [
      { id: 'production', name: '生产用能', field: 'production_energy_use' },
      { id: 'auxiliary', name: '辅助用能', field: 'auxiliary_energy_use' },
      { id: 'office', name: '办公用能', field: 'office_energy_use' },
    ];

    let accountedOutput = 0;
    for (const endUse of endUses) {
      const value = getValue(endUse.field);
      if (value > 0) {
        nodes.push({ id: endUse.id, name: endUse.name, category: 'end_use' });
        links.push({ source: 'distribution', target: endUse.id, value });
        accountedOutput += value;
      }
    }

    // Loss
    const loss = getValue('transmission_loss');
    if (loss > 0) {
      nodes.push({ id: 'loss', name: '输配损耗', category: 'end_use' });
      links.push({ source: 'distribution', target: 'loss', value: loss });
      accountedOutput += loss;
    }

    // Unaccounted
    const unaccounted = totalInput - accountedOutput;
    if (unaccounted > 0) {
      nodes.push({ id: 'other', name: '其他', category: 'end_use' });
      links.push({ source: 'distribution', target: 'other', value: unaccounted });
    }

    return { nodes, links };
  }
}

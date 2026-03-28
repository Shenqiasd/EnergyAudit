import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

@Injectable()
export class DataCalculationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async calculate(recordId: string) {
    const [record] = await this.db
      .select()
      .from(schema.dataRecords)
      .where(eq(schema.dataRecords.id, recordId))
      .limit(1);

    if (!record) {
      return { results: [], error: '数据记录不存在' };
    }

    // Fetch items
    const items = await this.db
      .select()
      .from(schema.dataItems)
      .where(eq(schema.dataItems.dataRecordId, recordId));

    // Build values map
    const values: Record<string, unknown> = {};
    for (const item of items) {
      const val = item.finalValue ?? item.rawValue;
      values[item.fieldCode] = val !== null && val !== '' ? Number(val) || val : null;
    }

    // Fetch calculation rules
    const rules = await this.db
      .select()
      .from(schema.calculationRules)
      .where(eq(schema.calculationRules.moduleCode, record.moduleCode));

    const activeRules = rules.filter((r) => r.isActive);

    // Resolve dependency order and execute
    const orderedRules = this.resolveDependencyOrder(activeRules);
    const results: Array<{
      fieldCode: string;
      value: number | string | null;
      ruleCode: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const rule of orderedRules) {
      const result = this.executeRule(rule, values);
      results.push(result);
      if (result.success && result.value !== null) {
        values[rule.outputFieldCode] = result.value;

        // Update calculated value in data items
        const existing = items.find((i) => i.fieldCode === rule.outputFieldCode);
        if (existing) {
          await this.db
            .update(schema.dataItems)
            .set({
              calculatedValue: String(result.value),
              finalValue: existing.manualOverrideValue ?? String(result.value),
            })
            .where(eq(schema.dataItems.id, existing.id));
        }
      }
    }

    // Create calculation snapshot
    const snapshotId = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await this.db.insert(schema.calculationSnapshots).values({
      id: snapshotId,
      auditProjectId: record.auditProjectId,
      calculationType: record.moduleCode,
      result: JSON.stringify(results),
      parametersSnapshot: JSON.stringify(values),
      isLatest: true,
    });

    return { results, snapshotId };
  }

  private resolveDependencyOrder(
    rules: Array<{
      ruleCode: string;
      expression: string;
      outputFieldCode: string;
      dependencies: unknown;
    }>,
  ) {
    const ruleMap = new Map(rules.map((r) => [r.outputFieldCode, r]));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const ordered: typeof rules = [];

    const visit = (fieldCode: string): void => {
      if (visited.has(fieldCode)) return;
      if (visiting.has(fieldCode)) return;

      visiting.add(fieldCode);
      const rule = ruleMap.get(fieldCode);
      if (rule) {
        const deps = Array.isArray(rule.dependencies)
          ? (rule.dependencies as string[])
          : [];
        for (const dep of deps) {
          visit(dep);
        }
        ordered.push(rule);
      }
      visiting.delete(fieldCode);
      visited.add(fieldCode);
    };

    for (const rule of rules) {
      visit(rule.outputFieldCode);
    }

    return ordered;
  }

  private executeRule(
    rule: {
      ruleCode: string;
      expression: string;
      dependencies: unknown;
      outputFieldCode: string;
    },
    values: Record<string, unknown>,
  ) {
    try {
      const deps = Array.isArray(rule.dependencies)
        ? (rule.dependencies as string[])
        : [];
      const fn = new Function(...deps, `return ${rule.expression}`);
      const args = deps.map((k) => {
        const v = values[k];
        return v !== undefined && v !== null && v !== '' ? Number(v) : 0;
      });
      const result = fn(...args);

      return {
        fieldCode: rule.outputFieldCode,
        value: typeof result === 'number' && isFinite(result) ? result : null,
        ruleCode: rule.ruleCode,
        success: true,
      };
    } catch (err) {
      return {
        fieldCode: rule.outputFieldCode,
        value: null,
        ruleCode: rule.ruleCode,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';
import { resolveValidationRules } from '@energy-audit/config-engine';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { ConfigOverrideRecord, ResolutionContext } from '@energy-audit/config-engine';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationError {
  ruleCode: string;
  layer: number;
  severity: ValidationSeverity;
  message: string;
  fieldCodes?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  canSave: boolean;
  canSubmit: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
}

@Injectable()
export class DataValidationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async validate(recordId: string): Promise<ValidationResult> {
    // Fetch record with items
    const [record] = await this.db
      .select()
      .from(schema.dataRecords)
      .where(eq(schema.dataRecords.id, recordId))
      .limit(1);

    if (!record) {
      return {
        isValid: false,
        canSave: false,
        canSubmit: false,
        errors: [
          {
            ruleCode: 'record_not_found',
            layer: 1,
            severity: 'error',
            message: '数据记录不存在',
          },
        ],
        warnings: [],
        infos: [],
      };
    }

    const items = await this.db
      .select()
      .from(schema.dataItems)
      .where(eq(schema.dataItems.dataRecordId, recordId));

    // Fetch validation rules for this module with config override resolution
    const rawRules = await this.db
      .select()
      .from(schema.validationRules)
      .where(eq(schema.validationRules.moduleCode, record.moduleCode));

    // Load config overrides for resolution context
    const overrides = await this.db
      .select()
      .from(schema.configOverrides)
      .where(eq(schema.configOverrides.isActive, true));

    const overrideRecords: ConfigOverrideRecord[] = overrides.map((o) => ({
      id: o.id,
      scopeType: o.scopeType as ConfigOverrideRecord['scopeType'],
      scopeId: o.scopeId,
      targetType: o.targetType as ConfigOverrideRecord['targetType'],
      targetCode: o.targetCode,
      configJson: o.configJson as Record<string, unknown>,
      isActive: o.isActive,
    }));

    // Build resolution context from project info
    const resolutionContext = await this.buildResolutionContext(record.auditProjectId);

    // Resolve effective rules through config override engine
    const resolvedRules = resolveValidationRules(rawRules, overrideRecords, resolutionContext);
    const activeRules = resolvedRules.filter((r) => r.isActive);
    const allErrors: ValidationError[] = [];

    // Build values map
    const values: Record<string, string | null> = {};
    for (const item of items) {
      values[item.fieldCode] = item.finalValue ?? item.rawValue;
    }

    // Execute validation rules by layer
    for (const rule of activeRules) {
      const error = this.executeRule({
        ruleCode: rule.ruleCode,
        layer: rule.layer,
        severity: rule.severity,
        expression: rule.expression,
        message: rule.message,
        fieldCodes: Array.isArray(rule.fieldCodes) ? rule.fieldCodes.join(',') : null,
      }, values);
      if (error) {
        allErrors.push(error);
      }
    }

    // Fetch field definitions to check required fields (Layer 1)
    const moduleConfig = await this.db
      .select()
      .from(schema.dataModules)
      .where(eq(schema.dataModules.code, record.moduleCode))
      .limit(1);

    if (moduleConfig.length > 0) {
      const fields = await this.db
        .select()
        .from(schema.dataFields)
        .where(eq(schema.dataFields.moduleId, moduleConfig[0].id));

      for (const field of fields) {
        const constraints = field.constraints as Record<string, unknown> | null;
        if (constraints?.required) {
          const val = values[field.code];
          if (val === null || val === undefined || val === '') {
            allErrors.push({
              ruleCode: `required_${field.code}`,
              layer: 1,
              severity: 'error',
              message: `${field.name}为必填项`,
              fieldCodes: [field.code],
            });
          }
        }
      }
    }

    // Persist validation results
    await this.db
      .delete(schema.validationResults)
      .where(eq(schema.validationResults.dataRecordId, recordId));

    for (const err of allErrors) {
      await this.db.insert(schema.validationResults).values({
        id: `vr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        dataRecordId: recordId,
        ruleCode: err.ruleCode,
        ruleType: `layer_${err.layer}`,
        moduleCode: record.moduleCode,
        fieldCode: err.fieldCodes?.[0] ?? null,
        severity: err.severity,
        message: err.message,
        blocksSubmission: err.severity === 'error',
      });
    }

    return this.aggregateResults(allErrors);
  }

  private executeRule(
    rule: {
      ruleCode: string;
      layer: number;
      severity: string;
      expression: string;
      message: string;
      fieldCodes: string | null;
    },
    values: Record<string, string | null>,
  ): ValidationError | null {
    try {
      const fieldCodes = rule.fieldCodes?.split(',').map((s) => s.trim()) ?? [];
      const fn = new Function('values', `with(values) { return ${rule.expression}; }`);
      const result = fn(values);

      if (!result) {
        return {
          ruleCode: rule.ruleCode,
          layer: rule.layer,
          severity: rule.severity as ValidationSeverity,
          message: rule.message,
          fieldCodes: fieldCodes.length > 0 ? fieldCodes : undefined,
        };
      }
      return null;
    } catch {
      return {
        ruleCode: rule.ruleCode,
        layer: rule.layer,
        severity: 'warning',
        message: `规则执行异常: ${rule.ruleCode}`,
      };
    }
  }

  private async buildResolutionContext(auditProjectId: string): Promise<ResolutionContext> {
    const [project] = await this.db
      .select()
      .from(schema.auditProjects)
      .where(eq(schema.auditProjects.id, auditProjectId))
      .limit(1);

    if (!project) return {};

    const [enterprise] = await this.db
      .select()
      .from(schema.enterprises)
      .where(eq(schema.enterprises.id, project.enterpriseId))
      .limit(1);

    return {
      enterpriseId: project.enterpriseId,
      batchId: project.batchId,
      industryCode: enterprise?.industryCode ?? undefined,
    };
  }

  private aggregateResults(errors: ValidationError[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      canSave: true,
      canSubmit: true,
      errors: [],
      warnings: [],
      infos: [],
    };

    for (const err of errors) {
      switch (err.severity) {
        case 'error':
          result.errors.push(err);
          break;
        case 'warning':
          result.warnings.push(err);
          break;
        case 'info':
          result.infos.push(err);
          break;
      }
    }

    result.isValid = result.errors.length === 0;
    result.canSubmit = result.errors.length === 0;
    result.canSave = true;
    return result;
  }
}

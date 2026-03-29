import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface SubmitExceptionDto {
  validationResultId: string;
  explanation: string;
}

@Injectable()
export class DataExceptionService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async submitException(
    dataRecordId: string,
    validationResultId: string,
    explanation: string,
    userId: string,
  ) {
    const id = `ve_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Look up the ruleCode from the validation result for stable re-linking
    const [validationResult] = await this.db
      .select()
      .from(schema.validationResults)
      .where(eq(schema.validationResults.id, validationResultId))
      .limit(1);

    const newException = {
      id,
      dataRecordId,
      validationResultId,
      ruleCode: validationResult?.ruleCode ?? null,
      explanation,
      submittedBy: userId,
      approvalStatus: 'pending',
      createdAt: new Date(),
    };

    await this.db.insert(schema.validationExceptions).values(newException);
    return newException;
  }

  async submitExceptions(
    dataRecordId: string,
    exceptions: SubmitExceptionDto[],
    userId: string,
  ) {
    const results = [];
    for (const exc of exceptions) {
      const result = await this.submitException(
        dataRecordId,
        exc.validationResultId,
        exc.explanation,
        userId,
      );
      results.push(result);
    }
    return results;
  }

  async listExceptions(dataRecordId: string) {
    return this.db
      .select()
      .from(schema.validationExceptions)
      .where(eq(schema.validationExceptions.dataRecordId, dataRecordId));
  }

  async listPendingExceptions() {
    return this.db
      .select({
        exception: schema.validationExceptions,
        validationResult: schema.validationResults,
        dataRecord: schema.dataRecords,
      })
      .from(schema.validationExceptions)
      .leftJoin(
        schema.validationResults,
        eq(schema.validationExceptions.validationResultId, schema.validationResults.id),
      )
      .leftJoin(
        schema.dataRecords,
        eq(schema.validationExceptions.dataRecordId, schema.dataRecords.id),
      )
      .where(eq(schema.validationExceptions.approvalStatus, 'pending'));
  }

  async approveException(exceptionId: string, approverId: string) {
    await this.db
      .update(schema.validationExceptions)
      .set({
        approvalStatus: 'approved',
        approvedBy: approverId,
        reviewedAt: new Date(),
      })
      .where(eq(schema.validationExceptions.id, exceptionId));

    const [updated] = await this.db
      .select()
      .from(schema.validationExceptions)
      .where(eq(schema.validationExceptions.id, exceptionId))
      .limit(1);

    return updated;
  }

  async rejectException(exceptionId: string, approverId: string, reason?: string) {
    await this.db
      .update(schema.validationExceptions)
      .set({
        approvalStatus: 'rejected',
        approvedBy: approverId,
        rejectionReason: reason ?? null,
        reviewedAt: new Date(),
      })
      .where(eq(schema.validationExceptions.id, exceptionId));

    const [updated] = await this.db
      .select()
      .from(schema.validationExceptions)
      .where(eq(schema.validationExceptions.id, exceptionId))
      .limit(1);

    return updated;
  }

  async hasApprovedExceptionsForBlockingValidations(dataRecordId: string): Promise<boolean> {
    // Get all blocking validation results for this record
    const blockingResults = await this.db
      .select()
      .from(schema.validationResults)
      .where(
        and(
          eq(schema.validationResults.dataRecordId, dataRecordId),
          eq(schema.validationResults.blocksSubmission, true),
        ),
      );

    if (blockingResults.length === 0) return true;

    // Check each blocking result has an approved exception (match by ruleCode for stability)
    for (const result of blockingResults) {
      const exceptions = await this.db
        .select()
        .from(schema.validationExceptions)
        .where(
          and(
            eq(schema.validationExceptions.dataRecordId, dataRecordId),
            eq(schema.validationExceptions.ruleCode, result.ruleCode),
            eq(schema.validationExceptions.approvalStatus, 'approved'),
          ),
        );

      if (exceptions.length === 0) return false;
    }

    return true;
  }
}

import { Controller, Get, Query, Res } from '@nestjs/common';

import { Roles } from '../auth/roles.decorator';
import { EnterpriseLedgerService } from './enterprise-ledger.service';
import { ReviewLedgerService } from './review-ledger.service';
import { RectificationLedgerService } from './rectification-ledger.service';
import { ExcelExportService } from '../export/excel-export.service';

import type { EnterpriseLedgerQuery } from './enterprise-ledger.service';
import type { ReviewLedgerQuery } from './review-ledger.service';
import type { RectificationLedgerQuery } from './rectification-ledger.service';
import type { FastifyReply } from 'fastify';

@Roles('manager')
@Controller('ledgers')
export class LedgerController {
  constructor(
    private readonly enterpriseLedgerService: EnterpriseLedgerService,
    private readonly reviewLedgerService: ReviewLedgerService,
    private readonly rectificationLedgerService: RectificationLedgerService,
    private readonly exportService: ExcelExportService,
  ) {}

  @Get('enterprise')
  async getEnterpriseLedger(@Query() query: EnterpriseLedgerQuery) {
    return this.enterpriseLedgerService.getLedger(query);
  }

  @Get('review')
  async getReviewLedger(@Query() query: ReviewLedgerQuery) {
    return this.reviewLedgerService.getLedger(query);
  }

  @Get('rectification')
  async getRectificationLedger(@Query() query: RectificationLedgerQuery) {
    return this.rectificationLedgerService.getLedger(query);
  }

  @Get('enterprise/export')
  async exportEnterpriseLedger(
    @Query() query: EnterpriseLedgerQuery,
    @Res() reply: FastifyReply,
  ) {
    const overrideQuery = { ...query, page: '1', pageSize: '10000' };
    const result = await this.enterpriseLedgerService.getLedger(overrideQuery);

    const csv = this.exportService.generateCsv(
      result.items.map((item) => ({
        ...item,
        filingProgress: `${(item.filingProgress * 100).toFixed(1)}%`,
        isOverdue: item.isOverdue ? '是' : '否',
      })),
      [
        { key: 'enterpriseName', header: '企业名称' },
        { key: 'industryCode', header: '行业代码' },
        { key: 'projectStatus', header: '项目状态' },
        { key: 'isOverdue', header: '是否超期' },
        { key: 'filingProgress', header: '填报进度' },
        { key: 'reviewScore', header: '审核评分' },
        { key: 'rectificationStatus', header: '整改状态' },
      ],
    );

    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header(
        'Content-Disposition',
        'attachment; filename="enterprise-ledger.csv"',
      )
      .send(csv);
  }

  @Get('review/export')
  async exportReviewLedger(
    @Query() query: ReviewLedgerQuery,
    @Res() reply: FastifyReply,
  ) {
    const overrideQuery = { ...query, page: '1', pageSize: '10000' };
    const result = await this.reviewLedgerService.getLedger(overrideQuery);

    const csv = this.exportService.generateCsv(
      result.items.map((item) => ({ ...item })),
      [
        { key: 'reviewTaskId', header: '审核任务ID' },
        { key: 'enterpriseName', header: '企业名称' },
        { key: 'reviewerId', header: '审核人' },
        { key: 'status', header: '状态' },
        { key: 'totalScore', header: '总分' },
        { key: 'issueCount', header: '问题数' },
        { key: 'completedAt', header: '完成时间' },
        { key: 'createdAt', header: '创建时间' },
      ],
    );

    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header(
        'Content-Disposition',
        'attachment; filename="review-ledger.csv"',
      )
      .send(csv);
  }

  @Get('rectification/export')
  async exportRectificationLedger(
    @Query() query: RectificationLedgerQuery,
    @Res() reply: FastifyReply,
  ) {
    const overrideQuery = { ...query, page: '1', pageSize: '10000' };
    const result =
      await this.rectificationLedgerService.getLedger(overrideQuery);

    const csv = this.exportService.generateCsv(
      result.items.map((item) => ({
        ...item,
        isOverdue: item.isOverdue ? '是' : '否',
        progressPercent: `${item.progressPercent}%`,
      })),
      [
        { key: 'title', header: '整改任务' },
        { key: 'enterpriseName', header: '企业名称' },
        { key: 'status', header: '状态' },
        { key: 'isOverdue', header: '是否超期' },
        { key: 'progressPercent', header: '进度' },
        { key: 'deadline', header: '截止日期' },
        { key: 'completedAt', header: '完成时间' },
        { key: 'createdAt', header: '创建时间' },
      ],
    );

    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header(
        'Content-Disposition',
        'attachment; filename="rectification-ledger.csv"',
      )
      .send(csv);
  }
}

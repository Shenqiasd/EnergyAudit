import { Controller, Get, Param, Query } from '@nestjs/common';

import { AuditLogService } from './audit-log.service';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditLogService.findAll({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      userId,
      action,
      targetType,
      startDate,
      endDate,
    });
  }

  @Get('entity/:entityType/:entityId')
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.auditLogService.findByEntity(
      entityType,
      entityId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }
}

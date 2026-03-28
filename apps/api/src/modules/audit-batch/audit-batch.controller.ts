import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { Roles } from '../auth/roles.decorator';
import { AuditBatchService } from './audit-batch.service';

import type {
  AssignEnterprisesDto,
  BatchListQuery,
  CreateBatchDto,
  UpdateBatchDto,
} from './audit-batch.service';

@Roles('manager')
@Controller('audit-batches')
export class AuditBatchController {
  constructor(private readonly batchService: AuditBatchService) {}

  @Post()
  async create(@Body() dto: CreateBatchDto) {
    return this.batchService.create(dto);
  }

  @Get()
  async findAll(@Query() query: BatchListQuery) {
    return this.batchService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.batchService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBatchDto) {
    return this.batchService.update(id, dto);
  }

  @Post(':id/assign')
  async assignEnterprises(
    @Param('id') id: string,
    @Body() dto: AssignEnterprisesDto,
  ) {
    return this.batchService.assignEnterprises(id, dto);
  }

  @Put(':id/close')
  async close(@Param('id') id: string) {
    return this.batchService.close(id);
  }

  @Patch(':id/extend-deadline')
  async extendDeadline(
    @Param('id') id: string,
    @Body() body: { newDeadline: string; reason: string; deadlineType?: 'filing' | 'review' },
  ) {
    return this.batchService.extendDeadline(id, body);
  }
}

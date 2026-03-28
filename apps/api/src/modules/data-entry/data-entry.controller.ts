import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import { Roles } from '../auth/roles.decorator';
import { DataCalculationService } from './data-calculation.service';
import { DataImportService } from './data-import.service';
import { DataLockService } from './data-lock.service';
import { DataRecordService } from './data-record.service';
import { DataValidationService } from './data-validation.service';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { ImportDataDto } from './data-import.service';
import type { CreateRecordDto, RecordListQuery, SaveRecordDto } from './data-record.service';

@Roles('enterprise_user', 'manager')
@Controller('data-entry')
export class DataEntryController {
  constructor(
    private readonly recordService: DataRecordService,
    private readonly validationService: DataValidationService,
    private readonly calculationService: DataCalculationService,
    private readonly importService: DataImportService,
    private readonly lockService: DataLockService,
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  @Get('modules')
  async listModules(@Query('projectId') projectId?: string) {
    const modules = await this.db
      .select()
      .from(schema.dataModules)
      .where(eq(schema.dataModules.isEnabled, true))
      .orderBy(schema.dataModules.sortOrder);

    if (projectId) {
      // Get existing records for this project to include status
      const records = await this.db
        .select()
        .from(schema.dataRecords)
        .where(eq(schema.dataRecords.auditProjectId, projectId));

      const recordMap = new Map(records.map((r) => [r.moduleCode, r]));

      return modules.map((m) => ({
        ...m,
        recordStatus: recordMap.get(m.code)?.status ?? 'not_started',
        recordId: recordMap.get(m.code)?.id ?? null,
      }));
    }

    return modules;
  }

  @Get('modules/:moduleCode/fields')
  async getModuleFields(@Param('moduleCode') moduleCode: string) {
    const [mod] = await this.db
      .select()
      .from(schema.dataModules)
      .where(eq(schema.dataModules.code, moduleCode))
      .limit(1);

    if (!mod) {
      return { fields: [], module: null };
    }

    const fields = await this.db
      .select()
      .from(schema.dataFields)
      .where(eq(schema.dataFields.moduleId, mod.id))
      .orderBy(schema.dataFields.sortOrder);

    return { module: mod, fields };
  }

  @Get('records')
  async listRecords(@Query() query: RecordListQuery) {
    return this.recordService.findAll(query);
  }

  @Get('records/:id')
  async getRecord(@Param('id') id: string) {
    return this.recordService.findById(id);
  }

  @Post('records')
  async createRecord(@Body() dto: CreateRecordDto) {
    return this.recordService.create(dto);
  }

  @Put('records/:id')
  async saveRecord(@Param('id') id: string, @Body() dto: SaveRecordDto) {
    return this.recordService.save(id, dto);
  }

  @Post('records/:id/submit')
  async submitRecord(@Param('id') id: string) {
    // Run validation first
    const validation = await this.validationService.validate(id);

    if (!validation.canSubmit) {
      return {
        submitted: false,
        validation,
        message: '存在错误，无法提交',
      };
    }

    const record = await this.recordService.submit(id);
    return { submitted: true, record, validation };
  }

  @Post('records/:id/return')
  async returnRecord(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.recordService.returnRecord(id, body.reason);
  }

  @Post('records/:id/lock')
  async acquireLock(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.lockService.acquireLock(id, body.userId);
  }

  @Delete('records/:id/lock')
  async releaseLock(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.lockService.releaseLock(id, body.userId);
  }

  @Post('records/:id/validate')
  async validateRecord(@Param('id') id: string) {
    return this.validationService.validate(id);
  }

  @Post('records/:id/calculate')
  async calculateRecord(@Param('id') id: string) {
    return this.calculationService.calculate(id);
  }

  @Post('import')
  async importData(@Body() dto: ImportDataDto) {
    return this.importService.importData(dto);
  }
}

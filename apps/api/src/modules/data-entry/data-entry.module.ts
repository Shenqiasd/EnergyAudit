import { Module } from '@nestjs/common';

import { DataCalculationService } from './data-calculation.service';
import { DataEntryController } from './data-entry.controller';
import { DataImportService } from './data-import.service';
import { DataLockService } from './data-lock.service';
import { DataRecordService } from './data-record.service';
import { DataValidationService } from './data-validation.service';

@Module({
  controllers: [DataEntryController],
  providers: [
    DataRecordService,
    DataValidationService,
    DataCalculationService,
    DataImportService,
    DataLockService,
  ],
  exports: [
    DataRecordService,
    DataValidationService,
    DataCalculationService,
    DataImportService,
    DataLockService,
  ],
})
export class DataEntryModule {}

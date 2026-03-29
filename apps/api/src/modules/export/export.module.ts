import { Module } from '@nestjs/common';

import { ExcelExportService } from './excel-export.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { ReportExportController } from './report-export.controller';

@Module({
  controllers: [ReportExportController],
  providers: [ExcelExportService, PdfGeneratorService],
  exports: [ExcelExportService, PdfGeneratorService],
})
export class ExportModule {}

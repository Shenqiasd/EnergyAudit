import { Module } from '@nestjs/common';

import { ExportModule } from '../export/export.module';

import { LedgerController } from './ledger.controller';
import { EnterpriseLedgerService } from './enterprise-ledger.service';
import { ReviewLedgerService } from './review-ledger.service';
import { RectificationLedgerService } from './rectification-ledger.service';

@Module({
  imports: [ExportModule],
  controllers: [LedgerController],
  providers: [
    EnterpriseLedgerService,
    ReviewLedgerService,
    RectificationLedgerService,
  ],
  exports: [
    EnterpriseLedgerService,
    ReviewLedgerService,
    RectificationLedgerService,
  ],
})
export class LedgerModule {}

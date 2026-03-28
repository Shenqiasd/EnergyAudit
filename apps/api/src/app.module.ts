import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './db/database.module';
import { AttachmentModule } from './modules/attachment/attachment.module';
import { BusinessTypeModule } from './modules/business-type/business-type.module';
import { AuditBatchModule } from './modules/audit-batch/audit-batch.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AuditProjectModule } from './modules/audit-project/audit-project.module';
import { CalculationModule } from './modules/calculation/calculation.module';
import { ChartModule } from './modules/chart/chart.module';
import { DataEntryModule } from './modules/data-entry/data-entry.module';
import { EnterpriseModule } from './modules/enterprise/enterprise.module';
import { HealthModule } from './modules/health/health.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { RectificationModule } from './modules/rectification/rectification.module';
import { ReportModule } from './modules/report/report.module';
import { ReviewModule } from './modules/review/review.module';
import { UserModule } from './modules/user/user.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    EnterpriseModule,
    UserModule,
    MasterDataModule,
    AuditBatchModule,
    AuditProjectModule,
    IntegrationModule,
    JobsModule,
    AuditLogModule,
    AttachmentModule,
    DataEntryModule,
    BusinessTypeModule,
    CalculationModule,
    ChartModule,
    ReportModule,
    ReviewModule,
    RectificationModule,
    StatisticsModule,
    LedgerModule,
    NotificationModule,
  ],
})
export class AppModule {}

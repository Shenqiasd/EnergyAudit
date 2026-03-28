import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './db/database.module';
import { AttachmentModule } from './modules/attachment/attachment.module';
import { AuditBatchModule } from './modules/audit-batch/audit-batch.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AuditProjectModule } from './modules/audit-project/audit-project.module';
import { DataEntryModule } from './modules/data-entry/data-entry.module';
import { EnterpriseModule } from './modules/enterprise/enterprise.module';
import { HealthModule } from './modules/health/health.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { UserModule } from './modules/user/user.module';

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
  ],
})
export class AppModule {}

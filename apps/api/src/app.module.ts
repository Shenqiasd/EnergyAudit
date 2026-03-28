import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './db/database.module';
import { EnterpriseModule } from './modules/enterprise/enterprise.module';
import { HealthModule } from './modules/health/health.module';
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
  ],
})
export class AppModule {}

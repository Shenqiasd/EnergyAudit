import { Module } from '@nestjs/common';

import { ENTERPRISE_INFO_ADAPTER, MockEnterpriseInfoAdapter } from '@energy-audit/integrations';

import { IntegrationController } from './integration.controller';
import { SyncJobService } from './sync-job.service';

@Module({
  controllers: [IntegrationController],
  providers: [
    SyncJobService,
    {
      provide: ENTERPRISE_INFO_ADAPTER,
      useFactory: () => new MockEnterpriseInfoAdapter(0),
    },
  ],
  exports: [SyncJobService],
})
export class IntegrationModule {}

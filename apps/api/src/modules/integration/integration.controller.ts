import { Controller, Get, Param, Post, Query } from '@nestjs/common';

import { SyncJobService } from './sync-job.service';

@Controller('integrations')
export class IntegrationController {
  constructor(private readonly syncJobService: SyncJobService) {}

  @Post('sync/:enterpriseId')
  async triggerSync(@Param('enterpriseId') enterpriseId: string) {
    return this.syncJobService.triggerSync(enterpriseId);
  }

  @Get('sync/:enterpriseId/status')
  async getSyncStatus(@Param('enterpriseId') enterpriseId: string) {
    return this.syncJobService.getSyncStatus(enterpriseId);
  }

  @Get('sync/:enterpriseId/history')
  async getSyncHistory(
    @Param('enterpriseId') enterpriseId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.syncJobService.getSyncHistory(
      enterpriseId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }
}

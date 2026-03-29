import { Module } from '@nestjs/common';

import { StatisticsController } from './statistics.controller';
import { BatchStatisticsService } from './batch-statistics.service';
import { IndustryStatisticsService } from './industry-statistics.service';
import { CarbonStatisticsService } from './carbon-statistics.service';
import { StatisticsService } from './statistics.service';
import { RegionStatisticsService } from './region-statistics.service';

@Module({
  controllers: [StatisticsController],
  providers: [
    BatchStatisticsService,
    IndustryStatisticsService,
    CarbonStatisticsService,
    StatisticsService,
    RegionStatisticsService,
  ],
  exports: [
    BatchStatisticsService,
    IndustryStatisticsService,
    CarbonStatisticsService,
    StatisticsService,
    RegionStatisticsService,
  ],
})
export class StatisticsModule {}

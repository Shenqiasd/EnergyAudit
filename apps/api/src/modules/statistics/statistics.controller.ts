import { Controller, Get, Param, Query } from '@nestjs/common';

import { BatchStatisticsService } from './batch-statistics.service';
import { IndustryStatisticsService } from './industry-statistics.service';
import { CarbonStatisticsService } from './carbon-statistics.service';
import { StatisticsService } from './statistics.service';

import type { IndustryStatisticsQuery } from './industry-statistics.service';
import type { CarbonStatisticsQuery } from './carbon-statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly batchStatisticsService: BatchStatisticsService,
    private readonly industryStatisticsService: IndustryStatisticsService,
    private readonly carbonStatisticsService: CarbonStatisticsService,
    private readonly statisticsService: StatisticsService,
  ) {}

  @Get('dashboard')
  async getDashboardSummary() {
    return this.statisticsService.getDashboardSummary();
  }

  @Get('batch/:batchId')
  async getBatchStatistics(@Param('batchId') batchId: string) {
    const stats =
      await this.batchStatisticsService.getBatchStatistics(batchId);
    const filingProgress =
      await this.batchStatisticsService.getFilingProgressByBatch(batchId);
    return { ...stats, filingProgress };
  }

  @Get('industry')
  async getIndustryStatistics(@Query() query: IndustryStatisticsQuery) {
    const [distribution, compliance, ranking] = await Promise.all([
      this.industryStatisticsService.getEnergyDistributionByIndustry(query),
      this.industryStatisticsService.getIndustryComplianceRate(query),
      this.industryStatisticsService.getIndustryEnergyIntensityRanking(query),
    ]);
    return { distribution, compliance, ranking };
  }

  @Get('carbon')
  async getCarbonStatistics(@Query() query: CarbonStatisticsQuery) {
    const [emissions, trends] = await Promise.all([
      this.carbonStatisticsService.getCarbonEmissions(query),
      this.carbonStatisticsService.getCarbonEmissionTrends(),
    ]);
    return { ...emissions, trends };
  }

  @Get('rankings')
  async getRankings(
    @Query() query: { metric?: string; batchId?: string },
  ) {
    return this.statisticsService.getRankings(query);
  }

  @Get('alerts')
  async getAlerts() {
    return this.statisticsService.getAlerts();
  }

  @Get('timeline')
  async getTimeline() {
    return this.statisticsService.getTimeline();
  }
}

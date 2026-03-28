import { Controller, Get, Param, Post } from '@nestjs/common';

import { ChartService } from './chart.service';

@Controller('charts')
export class ChartController {
  constructor(private readonly chartService: ChartService) {}

  @Get(':projectId')
  async listCharts(@Param('projectId') projectId: string) {
    return this.chartService.listCharts(projectId);
  }

  @Get(':projectId/:chartCode')
  async getChart(
    @Param('projectId') projectId: string,
    @Param('chartCode') chartCode: string,
  ) {
    const chart = await this.chartService.getChart(projectId, chartCode);
    if (!chart) {
      return { error: '图表不存在', chartCode };
    }
    return chart;
  }

  @Post(':projectId/generate')
  async generateCharts(@Param('projectId') projectId: string) {
    return this.chartService.generateCharts(projectId);
  }
}

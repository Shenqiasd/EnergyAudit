import { Module } from '@nestjs/common';

import { ChartController } from './chart.controller';
import { ChartService } from './chart.service';
import { EnergyFlowService } from './energy-flow.service';

@Module({
  controllers: [ChartController],
  providers: [ChartService, EnergyFlowService],
  exports: [ChartService, EnergyFlowService],
})
export class ChartModule {}

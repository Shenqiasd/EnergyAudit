import { Module } from '@nestjs/common';

import { CalculationController } from './calculation.controller';
import { CalculationEngine } from './calculation-engine';
import { CalculationService } from './calculation.service';
import { CarbonCalculationService } from './carbon-calculation.service';

@Module({
  controllers: [CalculationController],
  providers: [CalculationEngine, CarbonCalculationService, CalculationService],
  exports: [CalculationEngine, CarbonCalculationService, CalculationService],
})
export class CalculationModule {}

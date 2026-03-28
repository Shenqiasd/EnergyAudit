import { Controller, Get, Param, Post } from '@nestjs/common';

import { Roles } from '../auth/roles.decorator';
import { CalculationService } from './calculation.service';

@Roles('enterprise_user', 'manager')
@Controller('calculations')
export class CalculationController {
  constructor(private readonly calculationService: CalculationService) {}

  @Post('run/:projectId')
  async runCalculations(@Param('projectId') projectId: string) {
    return this.calculationService.runCalculations(projectId);
  }

  @Get('snapshots/:projectId')
  async getSnapshots(@Param('projectId') projectId: string) {
    return this.calculationService.getSnapshots(projectId);
  }

  @Get('snapshot/:snapshotId')
  async getSnapshotDetail(@Param('snapshotId') snapshotId: string) {
    return this.calculationService.getSnapshotById(snapshotId);
  }

  @Get('benchmarks/:projectId')
  async getBenchmarks(@Param('projectId') projectId: string) {
    return this.calculationService.getBenchmarkComparison(projectId);
  }
}

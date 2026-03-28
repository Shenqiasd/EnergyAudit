import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { RectificationService } from './rectification.service';

import type {
  RectificationListQuery,
  GenerateRectificationInput,
  UpdateProgressInput,
} from './rectification.service';

@Controller('rectifications')
export class RectificationController {
  constructor(
    private readonly rectificationService: RectificationService,
  ) {}

  @Post('generate')
  async generateFromIssues(@Body() body: GenerateRectificationInput) {
    return this.rectificationService.generateFromIssues(body);
  }

  @Get()
  async listTasks(@Query() query: RectificationListQuery) {
    return this.rectificationService.findAll(query);
  }

  @Get('stats')
  async getStatistics(@Query() query: { projectId?: string; batchId?: string }) {
    return this.rectificationService.getStatistics(query);
  }

  @Get(':id')
  async getTask(@Param('id') id: string) {
    return this.rectificationService.findById(id);
  }

  @Put(':id/issue')
  async issueToEnterprise(@Param('id') id: string) {
    return this.rectificationService.issueToEnterprise(id);
  }

  @Put(':id/claim')
  async claimTask(@Param('id') id: string) {
    return this.rectificationService.claimTask(id);
  }

  @Put(':id/progress')
  async updateProgress(
    @Param('id') id: string,
    @Body() body: UpdateProgressInput,
  ) {
    return this.rectificationService.updateProgress(id, body);
  }

  @Put(':id/submit')
  async submitForAcceptance(@Param('id') id: string) {
    return this.rectificationService.submitForAcceptance(id);
  }

  @Put(':id/accept')
  async acceptCompletion(@Param('id') id: string) {
    return this.rectificationService.acceptCompletion(id);
  }

  @Put(':id/reject')
  async rejectCompletion(@Param('id') id: string) {
    return this.rectificationService.rejectCompletion(id);
  }

  @Put(':id/delay')
  async markDelayed(@Param('id') id: string) {
    return this.rectificationService.markDelayed(id);
  }

  @Put(':id/close')
  async closeTask(@Param('id') id: string) {
    return this.rectificationService.closeTask(id);
  }
}

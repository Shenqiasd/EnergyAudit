import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { ReviewTaskService } from './review-task.service';
import { ReviewScoreService } from './review-score.service';
import { ReviewIssueService } from './review-issue.service';

import type { ReviewTaskListQuery, CreateReviewTaskInput } from './review-task.service';
import type { ScoreInput } from './review-score.service';
import type { CreateIssueInput } from './review-issue.service';

@Controller('reviews')
export class ReviewController {
  constructor(
    private readonly taskService: ReviewTaskService,
    private readonly scoreService: ReviewScoreService,
    private readonly issueService: ReviewIssueService,
  ) {}

  @Post()
  async createReviewTask(@Body() body: CreateReviewTaskInput) {
    return this.taskService.create(body);
  }

  @Get()
  async listReviewTasks(@Query() query: ReviewTaskListQuery) {
    return this.taskService.findAll(query);
  }

  @Get(':id')
  async getReviewTask(@Param('id') id: string) {
    return this.taskService.findById(id);
  }

  @Put(':id/assign')
  async assignReviewer(
    @Param('id') id: string,
    @Body() body: { reviewerId: string },
  ) {
    return this.taskService.assignReviewer(id, body.reviewerId);
  }

  @Put(':id/start')
  async startReview(@Param('id') id: string) {
    return this.taskService.startReview(id);
  }

  @Put(':id/submit')
  async submitConclusion(
    @Param('id') id: string,
    @Body() body: { conclusion: string; totalScore?: string },
  ) {
    return this.taskService.submitConclusion(id, body.conclusion, body.totalScore);
  }

  @Put(':id/confirm')
  async confirmReview(@Param('id') id: string) {
    return this.taskService.confirmReview(id);
  }

  @Put(':id/return')
  async returnReview(@Param('id') id: string) {
    return this.taskService.returnReview(id);
  }

  @Put(':id/close')
  async closeReview(@Param('id') id: string) {
    return this.taskService.closeReview(id);
  }

  @Post(':id/scores')
  async submitScores(
    @Param('id') id: string,
    @Body() body: { scores: ScoreInput[] },
  ) {
    return this.scoreService.submitScores(id, body.scores);
  }

  @Get(':id/scores')
  async getScores(@Param('id') id: string) {
    return this.scoreService.getScores(id);
  }

  @Post(':id/issues')
  async createIssue(
    @Param('id') id: string,
    @Body() body: Omit<CreateIssueInput, 'reviewTaskId'>,
  ) {
    return this.issueService.createIssue({ ...body, reviewTaskId: id });
  }

  @Get(':id/issues')
  async listIssues(@Param('id') id: string) {
    return this.issueService.getIssues(id);
  }

  @Put('issues/:issueId/resolve')
  async resolveIssue(@Param('issueId') issueId: string) {
    return this.issueService.resolveIssue(issueId);
  }
}

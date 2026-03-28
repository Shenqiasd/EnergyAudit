import { Module } from '@nestjs/common';

import { ReviewController } from './review.controller';
import { ReviewTaskService } from './review-task.service';
import { ReviewScoreService } from './review-score.service';
import { ReviewIssueService } from './review-issue.service';

@Module({
  controllers: [ReviewController],
  providers: [ReviewTaskService, ReviewScoreService, ReviewIssueService],
  exports: [ReviewTaskService, ReviewScoreService, ReviewIssueService],
})
export class ReviewModule {}

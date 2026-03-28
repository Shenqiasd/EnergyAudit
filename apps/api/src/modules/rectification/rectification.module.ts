import { Module } from '@nestjs/common';

import { RectificationController } from './rectification.controller';
import { RectificationService } from './rectification.service';

@Module({
  controllers: [RectificationController],
  providers: [RectificationService],
  exports: [RectificationService],
})
export class RectificationModule {}

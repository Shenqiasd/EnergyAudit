import { Module } from '@nestjs/common';

import { NotificationModule } from '../notification/notification.module';
import { RectificationController } from './rectification.controller';
import { RectificationService } from './rectification.service';

@Module({
  imports: [NotificationModule],
  controllers: [RectificationController],
  providers: [RectificationService],
  exports: [RectificationService],
})
export class RectificationModule {}

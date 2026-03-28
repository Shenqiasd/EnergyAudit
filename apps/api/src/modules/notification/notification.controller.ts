import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async listNotifications(
    @Headers('x-user-id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isRead') isRead?: string,
    @Query('type') type?: string,
  ) {
    return this.notificationService.findByRecipient(userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      type: type || undefined,
    });
  }

  @Get('unread-count')
  async getUnreadCount(@Headers('x-user-id') userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.notificationService.markAsRead(id, userId);
  }

  @Post('mark-all-read')
  async markAllAsRead(@Headers('x-user-id') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Delete(':id')
  async deleteNotification(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.notificationService.delete(id, userId);
  }
}

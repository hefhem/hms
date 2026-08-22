import { Controller, Get, Put, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getMyNotifications(@CurrentUser('role') role: string) {
    return this.notificationService.getNotificationsForRole(role || 'ADMIN');
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    await this.notificationService.markAsRead(id);
    return { success: true };
  }

  @Put('read-all')
  async markAllAsRead(@CurrentUser('role') role: string) {
    await this.notificationService.markAllAsReadForRole(role || 'ADMIN');
    return { success: true };
  }
}

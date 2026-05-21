import { Module } from '@nestjs/common'
import { NotificationModule } from '@data/domain/notification/notification.module'
import { NotificationsController } from './notifications.controller'

@Module({
  imports: [NotificationModule],
  controllers: [NotificationsController]
})
export class NotificationsHttpModule {}

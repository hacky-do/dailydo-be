import { Module } from '@nestjs/common'
import { NotificationModule } from '@data/domain/notification'
import { UserNotificationCron } from './user-notification.cron'

@Module({
  imports: [NotificationModule],
  providers: [UserNotificationCron]
})
export class UserNotificationModule {}

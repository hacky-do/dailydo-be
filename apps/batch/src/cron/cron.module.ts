import { Module } from '@nestjs/common'
import { UserNotificationModule } from './user-notification/user-notification.module'

@Module({
  imports: [UserNotificationModule],
  exports: [UserNotificationModule]
})
export class CronModule {}

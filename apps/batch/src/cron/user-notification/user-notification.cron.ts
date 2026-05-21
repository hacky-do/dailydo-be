import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { NotificationService } from '@data/domain/notification'

@Injectable()
export class UserNotificationCron {
  private readonly logger = new Logger(UserNotificationCron.name)

  constructor(private readonly notificationService: NotificationService) {}

  // @Cron('0 3 * * *', { timeZone: 'Asia/Seoul' })
  async cleanupExpiredNotifications() {
    this.logger.log('Running user notification cleanup...')

    try {
      const deletedCount = await this.notificationService.deleteExpiredNotifications()
      this.logger.log(`Deleted ${deletedCount} expired notifications`)
    } catch (error) {
      this.logger.error('Failed to cleanup notifications', error.stack)
    }
  }
}

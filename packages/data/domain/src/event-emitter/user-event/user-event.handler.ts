import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { NotificationService } from '../../notification/notification.service'
import { NotificationType, RecipientType } from '../../notification/types/notification.types'
import { UserEventType } from './types/event.types'
import type { UserBaseEvent, UserSignedUpMetadata } from './types/event.types'

@Injectable()
export class UserEventHandler {
  private readonly logger = new Logger(UserEventHandler.name)

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(UserEventType.USER_SIGNED_UP)
  async handleUserSignedUp(event: UserBaseEvent<UserEventType.USER_SIGNED_UP>) {
    const { userId } = event.metadata as UserSignedUpMetadata

    try {
      await this.notificationService.create({
        type: NotificationType.userWelcome,
        recipientId: userId,
        recipientType: RecipientType.user,
        targetId: 0
      })
    } catch (error) {
      this.logger.error(`Failed to handle user signed-up event - userId: ${userId}`, error.stack)
    }
  }
}

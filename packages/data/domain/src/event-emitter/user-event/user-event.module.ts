import { Module } from '@nestjs/common'
import { NotificationModule } from '../../notification/notification.module'
import { UserEventHandler } from './user-event.handler'
import { UserEventPublisher } from './user-event.publisher'

@Module({
  imports: [NotificationModule],
  providers: [UserEventHandler, UserEventPublisher],
  exports: [UserEventPublisher]
})
export class UserEventModule {}

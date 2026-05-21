import { Notification } from './notification.entity'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NotificationService } from './notification.service'

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [NotificationService],
  exports: [TypeOrmModule, NotificationService]
})
export class NotificationModule {}

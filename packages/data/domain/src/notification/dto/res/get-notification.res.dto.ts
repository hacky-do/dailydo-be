import { ApiProperty, OmitType } from '@nestjs/swagger'
import { Notification } from '../../notification.entity'
import { IsString } from 'class-validator'

export class GetNotificationResDto extends OmitType(Notification, ['recipientId', 'recipientType']) {
  @IsString()
  @ApiProperty({ description: '경과 시간 표시 (예: "방금", "n분 전", "n시간 전")' })
  displayTime: string
}

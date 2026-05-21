import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator'
import { NotificationType, RecipientType } from '../../types/notification.types'
import { ApiProperty } from '@nestjs/swagger'

export class NotificationData {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '알림에 표시될 사용자 이름', required: false })
  userName?: string
}

export class PostNotificationReqDto {
  @IsEnum(NotificationType)
  @ApiProperty({
    enum: NotificationType,
    description: '알림 타입'
  })
  type: NotificationType

  @IsInt()
  @ApiProperty({
    description: '알림 수신자 ID'
  })
  recipientId: number

  @IsEnum(RecipientType)
  @ApiProperty({
    enum: RecipientType,
    description: '수신자 타입 (user/ceo)'
  })
  recipientType: RecipientType

  @IsOptional()
  @IsInt()
  @ApiProperty({
    description: '알림 대상 ID'
  })
  targetId?: number

  @IsOptional()
  @ApiProperty({
    type: NotificationData,
    description: '알림 내용 생성에 필요한 데이터'
  })
  data?: NotificationData
}

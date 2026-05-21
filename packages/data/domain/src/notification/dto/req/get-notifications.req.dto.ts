import { GetPaginationReqDto } from '@data/dto'
import { NotificationType } from '../../types/notification.types'
import { IsEnum, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'

export class GetNotificationsReqDto extends GetPaginationReqDto {
  @IsOptional()
  @IsEnum(NotificationType)
  @ApiProperty({
    enum: NotificationType,
    description: '알림 타입 필터',
    required: false
  })
  type?: NotificationType

  @IsOptional()
  @ApiProperty({
    description: '읽음 여부 필터',
    required: false,
    type: Boolean
  })
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  isRead?: boolean
}

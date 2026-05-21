import { IsEnum, IsInt } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export enum NotificationType {
  userWelcome = 'userWelcome'
}

export enum TargetType {
  other = 'other'
}

export class TargetInfo {
  @IsEnum(TargetType)
  @ApiProperty({
    enum: TargetType,
    description: '알림 클릭시 이동할 대상 타입'
  })
  type: TargetType

  @IsInt()
  @ApiProperty({ description: '대상 ID' })
  id: number
}

export enum RecipientType {
  user = 'user',
  ceo = 'ceo'
}

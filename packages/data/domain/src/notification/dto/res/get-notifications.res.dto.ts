import { IsInt, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { GetNotificationResDto } from './get-notification.res.dto'

export class GetNotificationsResDto {
  @ValidateNested()
  @Type(() => GetNotificationResDto)
  data: GetNotificationResDto[]

  @IsInt()
  total: number
}

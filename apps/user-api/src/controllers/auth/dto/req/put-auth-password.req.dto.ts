import { regex } from '@data/lib'
import { ApiProperty } from '@nestjs/swagger'
import { Matches } from 'class-validator'

export class PutAuthPasswordReqDto {
  @Matches(regex.password.admin)
  @ApiProperty({ pattern: regex.password.admin.source })
  password: string

  @Matches(regex.password.admin)
  @ApiProperty({ pattern: regex.password.admin.source })
  newPassword: string
}

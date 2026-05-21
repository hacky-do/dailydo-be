import { User } from '@data/domain'
import { regex } from '@data/lib'
import { ApiProperty, PickType } from '@nestjs/swagger'
import { IsBoolean, IsOptional, Matches } from 'class-validator'

export class PostAuthReqDto extends PickType(User, ['email']) {
  @Matches(regex.password.admin)
  @ApiProperty({ pattern: regex.password.admin.source })
  password: string

  @IsOptional()
  @IsBoolean()
  remember?: boolean
}

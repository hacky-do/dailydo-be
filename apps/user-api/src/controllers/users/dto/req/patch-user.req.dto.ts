import { User } from '@data/domain'
import { OmitType, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsOptional } from 'class-validator'

export class PatchUserReqDto extends PartialType(
  OmitType(User, ['id', 'createdAt', 'updatedAt', 'accounts', 'phone', 'email', 'setting'])
) {
  @IsBoolean()
  @IsOptional()
  agreeMarketing: boolean
}

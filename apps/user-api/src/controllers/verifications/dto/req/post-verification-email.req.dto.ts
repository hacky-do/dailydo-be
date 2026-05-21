import { Verification } from '@data/domain'
import { PickType } from '@nestjs/swagger'
import { IsBoolean, IsOptional } from 'class-validator'

export class PostVerificationEmailReqDto extends PickType(Verification, ['type', 'email']) {
  @IsBoolean()
  @IsOptional()
  forAndroid: boolean
}

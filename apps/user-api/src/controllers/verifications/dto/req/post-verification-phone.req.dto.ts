import { Verification } from '@data/domain'
import { PickType } from '@nestjs/swagger'
import { IsBoolean, IsOptional } from 'class-validator'

export class PostVerificationPhoneReqDto extends PickType(Verification, ['type', 'phone']) {
  @IsBoolean()
  @IsOptional()
  forAndroid: boolean
}

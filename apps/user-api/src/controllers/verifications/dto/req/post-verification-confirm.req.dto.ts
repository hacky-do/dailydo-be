import { Verification } from '@data/domain'
import { PickType } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class PostVerificationConfirmReqDto extends PickType(Verification, ['code']) {
  @IsString()
  codeToken: string
}

import { ApiProperty, OmitType } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { PostVerificationsResDto } from '../res/post-verifications.res.dto'

export class PostVerificationPhoneResendReqDto extends OmitType(PostVerificationsResDto, ['expireAt', 'publicKey']) {
  @IsString()
  @ApiProperty({ title: '본인인증 토큰' })
  encryptMOKToken: string
}

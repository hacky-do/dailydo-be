import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsString } from 'class-validator'

export class PostVerificationPhoneResDto {
  @IsString()
  @ApiProperty({ title: '본인인증 토큰' })
  encryptMOKToken: string

  @IsInt()
  @ApiProperty({
    title: '재시도 가능 횟수',
    type: 'integer',
    description: '0일 경우는 재시도 시 [본인인증 시작] 부터 다시 진행해야 함.'
  })
  resendCount: number
}

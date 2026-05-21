import { ApiProperty } from '@nestjs/swagger'
import { IsDate, IsString } from 'class-validator'

export class PostVerificationsResDto {
  @IsString()
  @ApiProperty({ title: '세션 유지용 토큰' })
  codeToken: string

  @IsDate()
  @ApiProperty({ title: '세션 유지용 토큰 만료 시간' })
  expireAt: Date

  @IsString()
  @ApiProperty({ title: '본인인증 토큰' })
  encryptMOKToken: string

  @IsString()
  @ApiProperty({ title: '본인인증 공개키' })
  publicKey: string
}

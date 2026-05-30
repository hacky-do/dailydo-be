import { User } from '@data/domain'
import { regex } from '@data/lib'
import { ApiProperty, PickType } from '@nestjs/swagger'
import { IsBoolean, IsEnum, IsOptional, IsString, Matches } from 'class-validator'

export enum PostAuthRegisterReqDtoType {
  email = 'email',
  kakao = 'kakao',
  google = 'google',
  naver = 'naver',
  apple = 'apple',
  facebook = 'facebook'
}

export class PostAuthRegisterReqDto extends PickType(User, ['name', 'email', 'profileImage', 'description']) {
  @IsEnum(PostAuthRegisterReqDtoType)
  type: PostAuthRegisterReqDtoType

  @IsOptional()
  @Matches(regex.phone)
  @ApiProperty({ pattern: regex.phone.source, required: false })
  phone?: string

  @IsOptional()
  @Matches(regex.password.user)
  @ApiProperty({ pattern: regex.password.user.source, required: false })
  password?: string

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ description: '마케팅 활용 동의 여부' })
  agreeMarketing: boolean

  @IsOptional()
  @IsString()
  codeToken?: string

  @IsOptional()
  @IsString()
  socialToken?: string
}

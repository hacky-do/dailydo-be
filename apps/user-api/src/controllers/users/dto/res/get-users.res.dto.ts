import { User, UserSetting } from '@data/domain'
import { UserAccountType } from '@data/domain/user'
import { OmitType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEnum, IsObject, ValidateNested } from 'class-validator'

enum GetAuthResDtoAccountType {
  email = 'email',
  facebook = 'facebook',
  naver = 'naver',
  kakao = 'kakao',
  apple = 'apple',
  google = 'google'
}

export class GetAuthResDtoSetting extends OmitType(UserSetting, ['user', 'updatedAt']) {}

export class GetUsersResDto extends OmitType(User, ['accounts', 'setting']) {
  @IsObject()
  @ValidateNested()
  @Type(() => GetAuthResDtoSetting)
  setting: GetAuthResDtoSetting

  @IsEnum(UserAccountType, { each: true })
  accounts: GetAuthResDtoAccountType[]
}

import { IsEnum, IsString } from 'class-validator'

export enum GetAuthOauth2Type {
  apple = 'apple',
  google = 'google',
  facebook = 'facebook',
  kakao = 'kakao',
  naver = 'naver'
}

export class GetAuthOauth2ReqDto {
  @IsEnum(GetAuthOauth2Type)
  type: GetAuthOauth2Type

  @IsString()
  redirectUri: string
}

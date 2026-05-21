import { IsBoolean, IsEnum, IsString } from 'class-validator'
import { GetAuthOauth2Type } from './get-auth-oauth2.req.dto'

export class PostAuthSocialReqDto {
  @IsEnum(GetAuthOauth2Type)
  type: GetAuthOauth2Type

  @IsString()
  token: string

  @IsBoolean()
  remember: boolean
}

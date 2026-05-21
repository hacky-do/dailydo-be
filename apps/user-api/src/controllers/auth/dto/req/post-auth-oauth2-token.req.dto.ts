import { IsEnum, IsString } from 'class-validator'
import { GetAuthOauth2Type } from './get-auth-oauth2.req.dto'

export class PostAuthOauth2TokenReqDto {
  @IsEnum(GetAuthOauth2Type)
  type: GetAuthOauth2Type

  @IsString()
  socialToken: string
}

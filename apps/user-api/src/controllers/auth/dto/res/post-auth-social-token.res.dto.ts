import { Type } from 'class-transformer'
import { IsOptional, IsString, ValidateNested } from 'class-validator'

class PostAuthSocialTokenResDtoUser {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  email?: string
}

export class PostAuthSocialTokenResDto {
  @IsString()
  token: string

  @IsOptional()
  @ValidateNested()
  @Type(() => PostAuthSocialTokenResDtoUser)
  user?: PostAuthSocialTokenResDtoUser
}

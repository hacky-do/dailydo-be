import { IsDate, IsOptional, IsString } from 'class-validator'

export class PostVerificationResDto {
  @IsString()
  codeToken: string

  @IsDate()
  expireAt: Date

  @IsString()
  @IsOptional()
  code: string
}

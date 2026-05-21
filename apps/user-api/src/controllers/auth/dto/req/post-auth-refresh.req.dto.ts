import { IsOptional, IsString } from 'class-validator'

export class PostAuthRefreshReqDto {
  @IsOptional()
  @IsString()
  refreshToken?: string
}

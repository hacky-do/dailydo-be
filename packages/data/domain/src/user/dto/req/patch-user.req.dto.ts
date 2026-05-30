import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, IsUrl, Matches } from 'class-validator'
import { regex } from '@data/lib'

export class PatchUserReqDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  name?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional()
  profileImage?: string

  @IsOptional()
  @Matches(regex.phone)
  @ApiPropertyOptional({ pattern: regex.phone.source })
  phone?: string

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional()
  agreeMarketing?: boolean
}

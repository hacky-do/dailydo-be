import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString, IsUrl, Matches } from 'class-validator'
import { UserGender } from '../../user.type'
import { regex } from '@data/lib'

export class PatchUserReqDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  name?: string

  @IsOptional()
  @IsEnum(UserGender)
  @ApiPropertyOptional({ enum: UserGender })
  gender?: UserGender

  @IsOptional()
  @Matches(regex.date)
  @ApiPropertyOptional()
  birth?: string

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional()
  profileImage?: string

  @IsOptional()
  @Matches(regex.phone)
  @ApiPropertyOptional({ pattern: regex.phone.source })
  phone?: string
}

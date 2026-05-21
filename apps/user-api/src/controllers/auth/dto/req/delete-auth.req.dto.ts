import { IsOptional, IsString } from 'class-validator'

export class DeleteAuthReqDto {
  @IsOptional()
  @IsString()
  refreshToken?: string
}

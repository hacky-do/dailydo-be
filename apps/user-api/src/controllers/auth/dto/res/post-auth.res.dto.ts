import { IsInt, IsNumber, IsString } from 'class-validator'

export class PostAuthResDto {
  @IsNumber()
  id: number

  @IsString()
  accessToken: string

  @IsInt()
  expiresIn: number

  @IsString()
  refreshToken: string
}

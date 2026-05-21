import { IsString } from 'class-validator'

export class PostVerificationConfirmResDto {
  @IsString()
  codeToken: string
}

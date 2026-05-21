import { ApiProperty } from '@nestjs/swagger'
import { IsInt } from 'class-validator'

export class IdParamsDto {
  @IsInt()
  @ApiProperty({ type: 'integer' })
  id: number
}

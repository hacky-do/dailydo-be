import { Min } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

export class GetPaginationReqDto {
  @Type(() => Number)
  @ApiProperty({ type: 'integer', minimum: 0, default: 0 })
  @Min(0)
  start: number

  @Type(() => Number)
  @ApiProperty({ type: 'integer', minimum: 1, default: 10 })
  @Min(1)
  perPage: number

  constructor(partial: Partial<GetPaginationReqDto>) {
    Object.assign(this, partial)
  }
}

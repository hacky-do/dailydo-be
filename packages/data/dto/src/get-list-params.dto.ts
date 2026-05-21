import { applyDecorators } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsOptional, Max, Min } from 'class-validator'

export enum GetListOrderDto {
  ASC = 'ASC',
  DESC = 'DESC'
}

export function GetListOrderDtoProperty() {
  return applyDecorators(
    ApiProperty({
      enum: GetListOrderDto,
      title: '정렬 순서',
      description: `
  * ASC - 오름차순
  * DESC - 내림차순`
    })
  )
}

export class GetListParamsDto {
  @Type(() => Number)
  @Min(0)
  @ApiProperty({ description: '조회결과 시작위치 offset' })
  start: number

  @Type(() => Number)
  @Min(1)
  @Max(1000)
  @ApiProperty({ description: `조회결과 최대 건수` })
  perPage: number
}

export class GetListOptionalParamsDto {
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @ApiProperty({ description: '조회결과 시작위치 offset' })
  start?: number

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(1000)
  @ApiProperty({ description: `조회결과 최대 건수` })
  perPage?: number
}

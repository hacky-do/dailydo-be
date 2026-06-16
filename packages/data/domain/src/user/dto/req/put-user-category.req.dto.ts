import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator'

export class PutUserCategoryReqDto {
  @ApiProperty({ title: '카테고리 ID 목록 (정렬 순서대로)', type: Number, isArray: true, example: [1, 2, 3] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  categoryIds: number[]
}

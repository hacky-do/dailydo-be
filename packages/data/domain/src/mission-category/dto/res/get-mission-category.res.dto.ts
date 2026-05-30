import { MissionCategory } from '../../mission-category.entity'
import { ApiProperty, PickType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsInt, ValidateNested } from 'class-validator'

export class MissionCategoryItemDto extends PickType(MissionCategory, ['id', 'name']) {}

export class GetMissionCategoriesResDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MissionCategoryItemDto)
  @ApiProperty({ type: MissionCategoryItemDto, isArray: true })
  data: MissionCategoryItemDto[]

  @IsInt()
  @ApiProperty({ type: 'integer' })
  total: number
}

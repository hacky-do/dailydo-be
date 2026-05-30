import { ApiProperty, PickType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsInt, IsString, ValidateNested } from 'class-validator'
import { UserMissionCategory } from '../../entities/user-mission-category.entity'

export class UserCategoryItemDto extends PickType(UserMissionCategory, ['id', 'categoryId', 'sortOrder', 'createdAt', 'updatedAt']) {
  @IsString()
  @ApiProperty()
  name: string
}

export class GetUserCategoriesResDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserCategoryItemDto)
  @ApiProperty({ type: UserCategoryItemDto, isArray: true })
  data: UserCategoryItemDto[]

  @IsInt()
  @ApiProperty({ type: 'integer' })
  total: number
}

import { IntersectionType, PartialType, PickType } from '@nestjs/swagger'
import { UserMissionCategory } from '../../entities/user-mission-category.entity'

export class PostUserCategoryReqDto extends IntersectionType(
  PickType(UserMissionCategory, ['categoryId']),
  PartialType(PickType(UserMissionCategory, ['sortOrder'])),
) {}

import { PickType } from '@nestjs/swagger'
import { MissionCategory } from '../../mission-category.entity'

export class PostMissionCategoryReqDto extends PickType(MissionCategory, ['name']) {}

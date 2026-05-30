import { PartialType } from '@nestjs/swagger'
import { PostMissionCategoryReqDto } from './post-mission-category.req.dto'

export class PatchMissionCategoryReqDto extends PartialType(PostMissionCategoryReqDto) {}

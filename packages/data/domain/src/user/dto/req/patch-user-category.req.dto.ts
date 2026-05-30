import { PartialType } from '@nestjs/swagger'
import { PostUserCategoryReqDto } from './post-user-category.req.dto'

export class PatchUserCategoryReqDto extends PartialType(PostUserCategoryReqDto) {}

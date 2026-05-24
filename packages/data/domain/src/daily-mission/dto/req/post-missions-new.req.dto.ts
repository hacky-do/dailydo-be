import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, Min } from 'class-validator'

import { MAX_SELECTABLE, MIN_SELECTABLE } from '../../../_shared/cycle'

/**
 * POST /api/missions/new 요청 (backend-spec §4.5).
 *
 * - 1~3개, 중복 없음, 모두 현재 cycle pool 포함 (service 에서 재검증)
 * - 0개 → `mission_selection_required` / 4개+ → `mission_selection_limit_exceeded`
 */
export class PostMissionsNewReqDto {
  @ApiProperty({
    type: [Number],
    description: '선택 미션 ID 1~3개 (현재 cycle 후보 풀 안에서)',
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMinSize(MIN_SELECTABLE) // 0개면 service 에서 mission_selection_required
  @ArrayMaxSize(MAX_SELECTABLE) // 3개 초과면 mission_selection_limit_exceeded
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Type(() => Number)
  missionIds: number[]
}

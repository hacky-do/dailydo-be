import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator'

/**
 * GET /api/users/me/mylogs?limit&cursor (backend-spec §4.5).
 *
 * - `cursor` = YYYY-MM. 없으면 현재 KST 월 (서비스에서 `resolveCycle` 로 산출)
 * - `limit` = 한 번에 반환할 월 개수 (기본 5, 1~12)
 */
export class GetMylogsCalendarReqDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @ApiProperty({ required: false, description: '월 개수 (기본 5)', default: 5 })
  limit?: number

  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'cursor must be YYYY-MM' })
  @ApiProperty({
    required: false,
    description: '커서 (YYYY-MM). 없으면 현재 KST 월',
  })
  cursor?: string
}

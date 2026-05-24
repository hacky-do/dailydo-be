import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator'

import { MEMO_MAX_LENGTH } from '../../../_shared/cycle'

/**
 * PATCH /api/users/me/mylogs/:recordId (backend-spec §4.5).
 *
 * photo:
 *   - undefined → 변경 안 함
 *   - null      → 제거 (이전 photo 는 ch6 orphan outbox)
 *   - string    → 교체 (ch6 prefix 검증)
 *
 * memo:
 *   - undefined → 변경 안 함
 *   - null      → 제거
 *   - string    → 교체 (최대 200자, MEMO_MAX_LENGTH)
 */
export class PatchMylogReqDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== null) // null 허용, non-null 일 때만 string 검증
  @IsString()
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'photo URL. null 이면 제거. prefix 검증은 ch6 (v1 placeholder)',
  })
  photo?: string | null

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(MEMO_MAX_LENGTH) // INDEX §3.3(5)
  @ApiProperty({
    required: false,
    nullable: true,
    maxLength: MEMO_MAX_LENGTH,
    description: '메모 (최대 200자). null 이면 제거',
  })
  memo?: string | null
}

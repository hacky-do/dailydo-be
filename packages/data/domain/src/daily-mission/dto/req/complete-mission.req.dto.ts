import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator'

import { MEMO_MAX_LENGTH } from '../../../_shared/cycle'

/**
 * 완료 시 첨부할 마이로그 sub-object (backend-spec §4.5).
 * 둘 다 optional — 사진/메모 없이 완료도 가능 (body 자체 생략 가능).
 */
export class CompleteMissionMyLogDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'S3 photo URL (backend-spec §6.3 prefix 검증 — ch6 정본)',
  })
  photo?: string

  @IsOptional()
  @IsString()
  @MaxLength(MEMO_MAX_LENGTH) // 200자 초과 시 service 에서 memo_too_long 으로도 재검증
  @ApiProperty({ required: false, maxLength: MEMO_MAX_LENGTH })
  memo?: string
}

/**
 * POST /api/missions/:itemId — 완료 요청 (backend-spec §4.5).
 * mylog 없이 완료: `{}` 또는 body 생략.
 */
export class CompleteMissionReqDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CompleteMissionMyLogDto)
  @ApiProperty({
    type: CompleteMissionMyLogDto,
    required: false,
    description: '마이로그 없이 완료 시 생략',
  })
  mylog?: CompleteMissionMyLogDto
}

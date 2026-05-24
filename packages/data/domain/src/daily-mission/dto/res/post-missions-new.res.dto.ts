import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsString,
  ValidateNested,
} from 'class-validator'

import { DailyMissionStatus } from '../../../_shared/cycle'

/** POST /api/missions/new 응답의 확정 아이템 (backend-spec §4.5). */
export class ConfirmedItemDto {
  @IsInt()
  @ApiProperty({ format: 'int64' })
  itemId: number

  @IsInt()
  @ApiProperty({ format: 'int64' })
  missionId: number

  @IsString()
  @ApiProperty()
  title: string

  @IsBoolean()
  @ApiProperty()
  isSelected: boolean
}

/**
 * POST /api/missions/new 응답 (backend-spec §4.5).
 * 같은 missionIds 로 재확정 시 멱등 200 (backend-spec §5.3) — 기존 batch 정보 그대로 반환.
 */
export class PostMissionsNewResDto {
  @IsInt()
  @ApiProperty({ format: 'int64' })
  batchId: number

  @IsEnum(DailyMissionStatus)
  @ApiProperty({ enum: DailyMissionStatus })
  status: DailyMissionStatus

  @IsDate()
  @ApiProperty()
  confirmedAt: Date

  @IsInt()
  @ApiProperty()
  selectedCount: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmedItemDto)
  @ApiProperty({ type: [ConfirmedItemDto] })
  items: ConfirmedItemDto[]

  constructor(partial: Partial<PostMissionsNewResDto>) {
    Object.assign(this, partial)
  }
}

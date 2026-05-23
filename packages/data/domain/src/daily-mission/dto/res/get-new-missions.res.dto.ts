import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

import { DailyMissionCycle, DailyMissionStatus } from '../../../_shared/cycle'

/** GET /api/missions/new 후보 1개 — 무저장이라 itemId 없음 (backend-spec §4.5). */
export class NewMissionCandidateDto {
  @IsInt()
  @ApiProperty({ format: 'int64' })
  missionId: number

  @IsString()
  @ApiProperty()
  title: string

  @IsOptional()
  @IsString()
  @ApiProperty({ nullable: true })
  description: string | null

  @IsInt()
  @ApiProperty({ format: 'int64' })
  categoryId: number

  @IsOptional()
  @IsString()
  @ApiProperty({ nullable: true })
  categoryName: string | null

  @IsOptional()
  @IsString()
  @ApiProperty({ nullable: true })
  image: string | null

  @IsInt()
  @ApiProperty({ format: 'int64' })
  totalCompletedCount: number

  @IsBoolean()
  @ApiProperty()
  isSpecial: boolean
}

/**
 * GET /api/missions/new 응답 (backend-spec §4.5).
 * - 회원·미확정: status='ARRIVED' + items 10개
 * - 회원·확정됨: status='CONFIRMED' + items=[]
 * - 비회원: status/cycle* null + items 고정 10개 + isGuest:true
 */
export class GetNewMissionsResDto {
  @IsOptional()
  @IsEnum(DailyMissionStatus)
  @ApiProperty({ enum: DailyMissionStatus, nullable: true })
  status: DailyMissionStatus | null

  @IsOptional()
  @IsString()
  @ApiProperty({ nullable: true, description: 'KST YYYY-MM-DD' })
  missionDate: string | null

  @IsOptional()
  @IsEnum(DailyMissionCycle)
  @ApiProperty({ enum: DailyMissionCycle, nullable: true })
  cycle: DailyMissionCycle | null

  @IsOptional()
  @IsDate()
  @ApiProperty({ nullable: true })
  cycleStartedAt: Date | null

  @IsOptional()
  @IsDate()
  @ApiProperty({ nullable: true })
  cycleEndsAt: Date | null

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewMissionCandidateDto)
  @ApiProperty({ type: [NewMissionCandidateDto] })
  items: NewMissionCandidateDto[]

  @IsInt()
  @ApiProperty()
  minSelectableCount: number

  @IsInt()
  @ApiProperty()
  maxSelectableCount: number

  @IsBoolean()
  @ApiProperty()
  isGuest: boolean

  constructor(partial: Partial<GetNewMissionsResDto>) {
    Object.assign(this, partial)
  }
}

import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

import { DailyMissionStatus } from '../../../_shared/cycle'

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
 * GET /api/missions/new 응답
 * - 회원·미확정: status='ARRIVED' + missionDate + items 10개
 * - 회원·확정됨: status='CONFIRMED' + missionDate + items=[]
 * - 비회원: status/missionDate null + items 고정 10개 + isGuest:true
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

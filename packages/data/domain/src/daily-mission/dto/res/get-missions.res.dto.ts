import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

/** 선택 미션에 매달린 마이로그 sub-object (backend-spec §4.5). */
export class SelectedMissionMyLogDto {
  @IsInt()
  @ApiProperty({ format: 'int64' })
  id: number

  @IsOptional()
  @IsString()
  @ApiProperty({ nullable: true })
  photo: string | null

  @IsOptional()
  @IsString()
  @ApiProperty({ nullable: true })
  memo: string | null
}

/**
 * GET /api/missions 응답의 선택 미션 1개.
 *
 * - `itemId` = DailyMissionItem.id (backend-spec §4.4)
 * - `totalCompletedCount` = Mission 글로벌 누적 / `myCompletedCount` = UserMissionStat 개인 누적
 *   두 의미를 분리(backend-spec §3.4) — 프론트 reuse 안전
 */
export class SelectedMissionItemDto {
  @IsInt()
  @ApiProperty({ format: 'int64' })
  itemId: number

  @IsInt()
  @ApiProperty({ format: 'int64' })
  missionId: number

  @IsString()
  @ApiProperty()
  title: string

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

  @IsInt()
  @ApiProperty({ format: 'int64' })
  myCompletedCount: number

  @IsBoolean()
  @ApiProperty()
  completed: boolean

  @IsOptional()
  @IsDate()
  @ApiProperty({ nullable: true })
  completedAt: Date | null

  @IsOptional()
  @ValidateNested()
  @Type(() => SelectedMissionMyLogDto)
  @ApiProperty({ type: SelectedMissionMyLogDto, nullable: true })
  mylog: SelectedMissionMyLogDto | null
}

/**
 * GET /api/missions 응답 (backend-spec §4.5).
 * 비회원: `{ isGuest:true, items:[] }`
 */
export class GetMissionsResDto {
  @IsBoolean()
  @ApiProperty()
  isGuest: boolean

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedMissionItemDto)
  @ApiProperty({ type: [SelectedMissionItemDto] })
  items: SelectedMissionItemDto[]

  constructor(partial: Partial<GetMissionsResDto>) {
    Object.assign(this, partial)
  }
}

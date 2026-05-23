import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

/** 완료 응답의 마이로그 sub-object (backend-spec §4.5). */
export class CompleteMissionMyLogResDto {
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
 * POST /api/missions/:itemId 응답 (backend-spec §4.5).
 *
 * - `totalCompletedCount` = Mission 글로벌 누적 (Mission.totalCompletedCount)
 * - `myCompletedCount` = 사용자별 누적 (UserMissionStat.completedCount, backend-spec §3.4)
 * - 멱등: 이미 완료된 item 에 재호출 → 200 + 현재 상태 (counter 재증가 X, backend-spec §5.3)
 */
export class PostMissionCompleteResDto {
  @IsInt()
  @ApiProperty({ format: 'int64' })
  itemId: number

  @IsBoolean()
  @ApiProperty()
  completed: boolean

  @IsOptional()
  @IsDate()
  @ApiProperty({ nullable: true })
  completedAt: Date | null

  @IsInt()
  @ApiProperty({ format: 'int64' })
  totalCompletedCount: number

  @IsInt()
  @ApiProperty({ format: 'int64' })
  myCompletedCount: number

  @IsOptional()
  @ValidateNested()
  @Type(() => CompleteMissionMyLogResDto)
  @ApiProperty({ type: CompleteMissionMyLogResDto, nullable: true })
  mylog: CompleteMissionMyLogResDto | null

  constructor(partial: Partial<PostMissionCompleteResDto>) {
    Object.assign(this, partial)
  }
}

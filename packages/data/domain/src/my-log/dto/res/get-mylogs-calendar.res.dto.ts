import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator'

/** 캘린더의 하루 (해당 날짜 completed item 개수). */
export class CalendarDayDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @ApiProperty({ description: 'YYYY-MM-DD (KST)' })
  date: string

  @IsInt()
  @ApiProperty({ description: '해당 날짜 completed item 수 (MyLog 유무 무관, backend-spec §7)' })
  count: number
}

/** 캘린더의 한 달. */
export class CalendarMonthDto {
  @IsInt()
  @ApiProperty({ description: '같은 month 라도 다른 year 충돌 방지용' })
  year: number

  @IsInt()
  @ApiProperty()
  month: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalendarDayDto)
  @ApiProperty({ type: [CalendarDayDto] })
  logs: CalendarDayDto[]
}

/**
 * GET /api/users/me/mylogs 응답 (backend-spec §4.5).
 * - records: 최신 → 과거 월별 그룹
 * - nextCursor: 더 과거 없으면 null
 */
export class GetMylogsCalendarResDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalendarMonthDto)
  @ApiProperty({ type: [CalendarMonthDto] })
  records: CalendarMonthDto[]

  @IsOptional()
  @IsString()
  @ApiProperty({ nullable: true, description: '더 없으면 null (YYYY-MM)' })
  nextCursor: string | null

  constructor(partial: Partial<GetMylogsCalendarResDto>) {
    Object.assign(this, partial)
  }
}

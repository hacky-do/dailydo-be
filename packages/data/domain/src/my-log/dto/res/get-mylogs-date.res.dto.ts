import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

/** MyLog inline (없으면 null). */
export class MylogInlineDto {
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

/** 날짜별 완료 기록 1건. recordId = DailyMissionItem.id (backend-spec §4.4 / §4.5). */
export class MylogDateRecordDto {
  @IsInt()
  @ApiProperty({ format: 'int64', description: 'recordId = DailyMissionItem.id' })
  recordId: number

  @IsInt()
  @ApiProperty({ format: 'int64' })
  missionId: number

  @IsInt()
  @ApiProperty({ format: 'int64' })
  categoryId: number

  @IsString()
  @ApiProperty()
  categoryName: string

  @IsString()
  @ApiProperty()
  title: string

  @IsInt()
  @ApiProperty({
    format: 'int64',
    description: '이 미션 시점 누적 완료 순번 (ROW_NUMBER window, backend-spec §7)',
  })
  myCompletedCount: number

  @IsOptional()
  @IsDate()
  @ApiProperty({ nullable: true, description: 'RFC3339 +09:00' })
  completedAt: Date | null

  @IsOptional()
  @ValidateNested()
  @Type(() => MylogInlineDto)
  @ApiProperty({ type: MylogInlineDto, nullable: true, description: 'MyLog 없으면 null' })
  mylog: MylogInlineDto | null
}

/** GET /api/users/me/mylogs/:date 응답. */
export class GetMylogsDateResDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MylogDateRecordDto)
  @ApiProperty({ type: [MylogDateRecordDto] })
  records: MylogDateRecordDto[]

  constructor(partial: Partial<GetMylogsDateResDto>) {
    Object.assign(this, partial)
  }
}

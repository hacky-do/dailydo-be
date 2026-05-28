import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

/** 날짜별 완료 기록 1건. id = DailyMissionItem.id (= PATCH 의 recordId, backend-spec §4.4 / §4.5). */
export class MylogDateRecordDto {
  @IsString()
  @ApiProperty({ description: 'recordId = DailyMissionItem.id (string)' })
  id: string

  @IsInt()
  @ApiProperty({ format: 'int64' })
  categoryId: number

  @IsString()
  @ApiProperty()
  categoryName: string

  @IsInt()
  @ApiProperty({
    format: 'int64',
    description: '이 미션 시점 누적 완료 순번 (ROW_NUMBER window, backend-spec §7)',
  })
  completedCount: number

  @IsString()
  @ApiProperty()
  title: string

  @IsOptional()
  @IsString()
  @ApiProperty({ nullable: true, description: '사진 URL (없으면 null)' })
  photo: string | null

  @IsString()
  @ApiProperty({ description: 'ISO 8601 + KST offset (YYYY-MM-DDTHH:mm:ss+09:00)' })
  createdAt: string

  @IsOptional()
  @IsString()
  @ApiProperty({ nullable: true, description: '메모 (없으면 null)' })
  memo: string | null
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

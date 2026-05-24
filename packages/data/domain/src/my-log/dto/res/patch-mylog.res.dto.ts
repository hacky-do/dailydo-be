import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString } from 'class-validator'

/**
 * PATCH /api/users/me/mylogs/:recordId 응답 — MyLog 의 현재 상태 (backend-spec §4.5).
 * MyLog 가 없던 record 도 신규 create 후 반환.
 */
export class PatchMylogResDto {
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

  constructor(partial: Partial<PatchMylogResDto>) {
    Object.assign(this, partial)
  }
}

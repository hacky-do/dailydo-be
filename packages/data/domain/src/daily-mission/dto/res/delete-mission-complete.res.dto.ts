import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsInt } from 'class-validator'

/**
 * DELETE /api/missions/:itemId 응답 — 완료 취소 (backend-spec §4.5).
 *
 * ⚠ **v1 미지원 (INDEX §Scope-v1)**: 본 DTO 는 향후 취소 재활성화 대비 **계약으로 유지**.
 * v1 에서는 컨트롤러 핸들러 미등록, 서비스 `cancelCompleteItem` 미구현.
 * 가이드 ch4 §6.4 / §7.1 의 정의는 그대로 살아있어 활성화 시 별도 재정의 없이 켜기만 하면 됨.
 */
export class DeleteMissionCompleteResDto {
  @IsInt()
  @ApiProperty({ format: 'int64' })
  itemId: number

  @IsBoolean()
  @ApiProperty()
  completed: boolean

  @IsInt()
  @ApiProperty({ format: 'int64' })
  totalCompletedCount: number

  @IsInt()
  @ApiProperty({ format: 'int64' })
  myCompletedCount: number

  constructor(partial: Partial<DeleteMissionCompleteResDto>) {
    Object.assign(this, partial)
  }
}

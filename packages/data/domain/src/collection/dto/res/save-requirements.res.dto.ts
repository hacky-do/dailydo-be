import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsInt, IsString } from 'class-validator'

export class SaveRequirementsResDto {
  @IsInt()
  @ApiProperty({ example: 2, description: '새로 저장된 매핑 수' })
  inserted: number

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String], description: '존재하지 않아 건너뛴 missionId' })
  skippedMissionIds: string[]

  constructor(partial: Partial<SaveRequirementsResDto>) {
    Object.assign(this, partial)
  }
}

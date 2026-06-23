import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator'

export class RequirementItemDto {
  @IsString()
  @ApiProperty({ title: '미션 ID', example: '1' })
  missionId: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiProperty({ title: '필요 완료 수', required: false, default: 1 })
  requiredCount?: number
}

export class SaveRequirementsReqDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RequirementItemDto)
  @ApiProperty({ type: [RequirementItemDto], title: '획득 조건 매핑 (컬렉션 1 : 미션 N)' })
  requirements: RequirementItemDto[]
}

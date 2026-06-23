import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator'

export class MissionListItemDto {
  @IsString()
  @ApiProperty({ example: '1' })
  id: string

  @IsString()
  @ApiProperty({ example: '1' })
  categoryId: string

  @IsString()
  @ApiProperty()
  title: string

  @IsString()
  @ApiProperty()
  type: string

  @IsBoolean()
  @ApiProperty()
  isActive: boolean
}

export class ListMissionsResDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MissionListItemDto)
  @ApiProperty({ type: [MissionListItemDto] })
  missions: MissionListItemDto[]

  constructor(partial: Partial<ListMissionsResDto>) {
    Object.assign(this, partial)
  }
}

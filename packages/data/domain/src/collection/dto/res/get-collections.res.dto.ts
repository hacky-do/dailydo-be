import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'

export class CollectionRequirementResDto {
  @IsInt()
  @ApiProperty({ format: 'int64' })
  missionId: number

  @IsString()
  @ApiProperty()
  title: string

  @IsInt()
  @ApiProperty({ format: 'int32' })
  count: number
}

export class CollectionItemResDto {
  @IsString()
  @ApiProperty({ example: '1' })
  collectionId: string

  @IsOptional()
  @IsString()
  @ApiProperty({ nullable: true })
  image: string | null

  @IsString()
  @ApiProperty()
  title: string

  @IsBoolean()
  @ApiProperty()
  completed: boolean

  @IsString()
  @ApiProperty()
  description: string

  @IsNumber()
  @ApiProperty({ example: 2.6 })
  acquisitionRate: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectionRequirementResDto)
  @ApiProperty({ type: [CollectionRequirementResDto] })
  requirements: CollectionRequirementResDto[]
}

export class GetCollectionsResDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectionItemResDto)
  @ApiProperty({ type: [CollectionItemResDto] })
  collections: CollectionItemResDto[]

  constructor(partial: Partial<GetCollectionsResDto>) {
    Object.assign(this, partial)
  }
}

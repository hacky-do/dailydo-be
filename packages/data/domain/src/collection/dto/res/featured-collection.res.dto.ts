import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'

import { CollectionType } from '../../collection.entity'

export class FeaturedCollectionResDto {
  @IsString()
  @ApiProperty({ example: '1' })
  id: string

  @IsOptional()
  @IsString()
  @ApiProperty({ nullable: true })
  image: string | null

  @IsString()
  @ApiProperty()
  description: string

  @IsString()
  @ApiProperty()
  title: string

  @IsEnum(CollectionType)
  @ApiProperty({ enum: CollectionType, description: '컬렉션 타입 (NORMAL | SPECIAL)' })
  type: CollectionType

  constructor(partial: Partial<FeaturedCollectionResDto>) {
    Object.assign(this, partial)
  }
}

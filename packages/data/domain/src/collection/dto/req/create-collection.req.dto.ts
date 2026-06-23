import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator'

import { CollectionType } from '../../collection.entity'

export class CreateCollectionReqDto {
  @Length(1, 100)
  @IsString()
  @ApiProperty({ title: '컬렉션 이름', example: '나는 반딧불' })
  title: string

  @IsOptional()
  @IsString()
  @ApiProperty({ title: '설명', required: false, default: '' })
  description?: string

  @IsOptional()
  @IsString()
  @ApiProperty({ title: '이미지 URL', required: false, nullable: true })
  imageUrl?: string

  @IsOptional()
  @IsEnum(CollectionType)
  @ApiProperty({ enum: CollectionType, required: false, default: CollectionType.NORMAL })
  type?: CollectionType

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ title: '활성 여부', required: false, default: true })
  isActive?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  @ApiProperty({ title: '정렬 순서', required: false, default: 0 })
  sortOrder?: number
}

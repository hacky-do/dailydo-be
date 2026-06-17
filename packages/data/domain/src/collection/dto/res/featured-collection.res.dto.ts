import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

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

  constructor(partial: Partial<FeaturedCollectionResDto>) {
    Object.assign(this, partial)
  }
}

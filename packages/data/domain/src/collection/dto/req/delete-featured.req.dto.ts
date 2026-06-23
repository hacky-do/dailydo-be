import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class DeleteFeaturedReqDto {
  @IsString()
  @ApiProperty({ example: '1' })
  collectionId: string
}

import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class SetFeaturedReqDto {
  @IsString()
  @ApiProperty({ example: '1' })
  collectionId: string
}

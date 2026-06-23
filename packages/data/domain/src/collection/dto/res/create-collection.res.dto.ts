import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CreateCollectionResDto {
  @IsString()
  @ApiProperty({ example: '1', description: '생성된 컬렉션 id' })
  id: string

  constructor(partial: Partial<CreateCollectionResDto>) {
    Object.assign(this, partial)
  }
}

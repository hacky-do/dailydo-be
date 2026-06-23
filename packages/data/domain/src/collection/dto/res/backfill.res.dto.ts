import { ApiProperty } from '@nestjs/swagger'
import { IsInt } from 'class-validator'

export class BackfillResDto {
  @IsInt()
  @ApiProperty({ example: 42, description: '이번에 새로 해금된 유저 수 (이미 보유한 유저 제외)' })
  affected: number

  constructor(partial: Partial<BackfillResDto>) {
    Object.assign(this, partial)
  }
}

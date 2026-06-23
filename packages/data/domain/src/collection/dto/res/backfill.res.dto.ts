import { ApiProperty } from '@nestjs/swagger'
import { IsInt } from 'class-validator'

export class BackfillResDto {
  @IsInt()
  @ApiProperty({ example: 42, description: '가입 보상("첫 만남") 새로 해금된 유저 수' })
  signupAffected: number

  @IsInt()
  @ApiProperty({ example: 12, description: '트로피("시작의 트로피") 새로 해금된 유저 수 (이미 미션 완료자)' })
  trophyAffected: number

  constructor(partial: Partial<BackfillResDto>) {
    Object.assign(this, partial)
  }
}

import { ApiProperty } from '@nestjs/swagger'
import { UserAccountType, UserGender } from '../../user.type'

export class GetUserResDto {
  @ApiProperty()
  id: number

  @ApiProperty()
  email: string

  @ApiProperty()
  name: string

  @ApiProperty({ enum: UserGender, required: false, nullable: true })
  gender?: UserGender

  @ApiProperty({ required: false, nullable: true })
  profileImage?: string

  @ApiProperty({ required: false, nullable: true })
  birth?: string

  @ApiProperty({ required: false, nullable: true })
  phone?: string

  @ApiProperty({ type: Date })
  createdAt: Date

  @ApiProperty({ enum: UserAccountType, isArray: true })
  accounts: UserAccountType[]
}

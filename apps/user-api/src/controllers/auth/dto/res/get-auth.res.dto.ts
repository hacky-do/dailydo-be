import { User } from '@data/domain'
import { PickType } from '@nestjs/swagger'

export class GetAuthResDto extends PickType(User, ['id', 'name']) {}

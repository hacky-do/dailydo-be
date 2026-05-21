import { Verification } from '@data/domain'
import { PickType } from '@nestjs/swagger'

export class PostVerificationsReqDto extends PickType(Verification, ['type']) {}

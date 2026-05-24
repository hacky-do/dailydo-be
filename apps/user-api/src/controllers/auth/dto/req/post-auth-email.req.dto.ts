import { OmitType } from '@nestjs/swagger'
import { PostAuthRegisterReqDto } from './post-auth-register.req.dto'

export class PostAuthEmailReqDto extends OmitType(PostAuthRegisterReqDto, ['type'] as const) {}

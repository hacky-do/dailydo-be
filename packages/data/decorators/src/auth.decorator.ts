import { applyDecorators, SetMetadata } from '@nestjs/common'
import { ApiBearerAuth, ApiCookieAuth, ApiUnauthorizedResponse } from '@nestjs/swagger'

export const ROLE_KEY = 'role'

export function Auth(options: { type: 'admin' | 'vendor' | 'user'; roles?: string[] }) {
  if (options.type === 'admin' || options.type === 'vendor') {
    return applyDecorators(
      SetMetadata(ROLE_KEY, options),
      ApiCookieAuth(),
      ApiUnauthorizedResponse({ description: 'Unauthorized' })
    )
  }
  return applyDecorators(
    SetMetadata(ROLE_KEY, options),
    ApiCookieAuth(),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' })
  )
}

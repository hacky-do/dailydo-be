import { IS_PUBLIC_KEY, ROLE_KEY } from '@data/decorators'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const role = this.reflector.getAllAndOverride<{ type: string; roles: string[] }>(ROLE_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    const req = context.switchToHttp().getRequest()
    return isPublic || !role?.type || req.user?.role.indexOf(role.type) > -1
  }
}

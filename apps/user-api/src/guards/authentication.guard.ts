import { IS_PUBLIC_KEY } from '@data/decorators'
import { CanActivate, ExecutionContext, Injectable, Type } from '@nestjs/common'
import { ModuleRef, Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    const guard = new (AuthGuard('jwt') as unknown as Type<CanActivate>)(this.reflector, this.moduleRef)

    try {
      await guard.canActivate(context)
      return true
    } catch (e) {
      if (isPublic) return true
      throw e
    }
  }
}

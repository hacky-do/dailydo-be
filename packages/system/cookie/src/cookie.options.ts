import { type ModuleMetadata } from '@nestjs/common'

export interface CookieModuleOptions {
  cookieDomain: string
}

export interface CookieAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => Promise<CookieModuleOptions> | CookieModuleOptions
  inject?: any[]
}

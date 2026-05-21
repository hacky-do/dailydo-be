import { LoggerService, ModuleMetadata } from '@nestjs/common'
import { type RedisOptions } from 'ioredis'
import { type SignOptions } from 'jsonwebtoken'

export interface JwtModuleOptions {
  options: {
    signOptions?: SignOptions
    privateKey: string
    publicKey: string
  }
  redis: RedisOptions
}

export interface JwtModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => JwtModuleOptions | Promise<JwtModuleOptions>
  inject?: any[]
}

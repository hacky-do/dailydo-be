import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common'
import { SocialService } from './social.service'

export interface SocialOptions {
  oauth2Path?: string
  callbackUri: string
  apple?: {
    clientId: string
    clientSecret: string
    teamId: string
    keyId: string
    scope?: string[]
  }
  facebook?: {
    clientId: string
    clientSecret: string
    scope?: string[]
  }
  google?: {
    clientId: string
    clientSecret: string
    scope?: string[]
  }
  kakao?: {
    clientId: string
    clientSecret: string
    scope?: string[]
    service_terms?: string[]
  }
  naver?: {
    clientId: string
    clientSecret: string
    scope?: string[]
  }
  cognito?: {
    domain: string
    clientId: string
    clientSecret: string
    scope?: string[]
  }
}

export interface SocialAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => SocialOptions | Promise<SocialOptions>
  inject?: any[]
}

@Module({})
export class SocialModule {
  static forRootAsync(options: SocialAsyncOptions): DynamicModule {
    return {
      global: true,
      imports: options.imports,
      module: SocialModule,
      providers: [
        {
          provide: 'SOCIAL_CONFIG_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject
        },
        SocialService
      ],
      exports: ['SOCIAL_CONFIG_OPTIONS', SocialService]
    }
  }
}

import { DynamicModule, Module } from '@nestjs/common'
import { CookieService } from './cookie.service'
import { type CookieAsyncOptions } from './cookie.options'

@Module({
  imports: []
})
export class CookieModule {
  static forRootAsync(options: CookieAsyncOptions): DynamicModule {
    return {
      global: true,
      imports: options.imports,
      module: CookieModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || []
        },
        CookieService
      ],
      exports: [CookieService]
    }
  }
}

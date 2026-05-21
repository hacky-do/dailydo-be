import { DynamicModule, Module } from '@nestjs/common'
import { HttpLoggerService } from './http-logger.service'
import type { HttpLoggerAsyncOptions, HttpLoggerOptions } from './http-logger.options'

@Module({})
export class HttpLoggerModule {
  static register(options: HttpLoggerOptions): DynamicModule {
    return {
      imports: [],
      module: HttpLoggerModule,
      providers: [
        {
          provide: 'HTTP_LOGGER_CONFIG',
          useValue: options
        },
        HttpLoggerService
      ],
      exports: [HttpLoggerService]
    }
  }

  static registerAsync(options: HttpLoggerAsyncOptions): DynamicModule {
    return {
      imports: options.imports,
      module: HttpLoggerModule,
      providers: [
        {
          provide: 'HTTP_LOGGER_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject
        },
        HttpLoggerService
      ],
      exports: [HttpLoggerService]
    }
  }
}

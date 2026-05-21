import { DynamicModule, Module } from '@nestjs/common'
import { AwsService } from './aws.service'
import { type AwsModuleAsyncOptions } from './aws.options'

@Module({
  imports: []
})
export class AwsModule {
  static forRootAsync(options: AwsModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      imports: options.imports,
      module: AwsModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || []
        },
        AwsService
      ],
      exports: [AwsService]
    }
  }
}

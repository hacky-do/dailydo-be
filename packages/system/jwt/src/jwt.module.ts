import { DynamicModule, Module, Provider } from '@nestjs/common'
import { JwtModule as NestJwtModule } from '@nestjs/jwt'
import { createPrivateKey, createPublicKey } from 'node:crypto'
import { JwtService } from './jwt.service'
import { JwtModuleAsyncOptions, JwtModuleOptions } from './jwt.options'

@Module({
  imports: []
})
export class JwtModule {
  static forRootAsync(options: JwtModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: 'JWT_CONFIG_OPTIONS',
      useFactory: options.useFactory,
      inject: options.inject || []
    }

    return {
      global: true,
      imports: [
        NestJwtModule.registerAsync({
          inject: ['JWT_CONFIG_OPTIONS'],
          useFactory: async (config: JwtModuleOptions) => {
            const validPrivateKey = (keyString: string) => {
              try {
                createPrivateKey(keyString)
                return true
              } catch (err) {
                return false
              }
            }

            const validPublicKey = (keyString: string) => {
              try {
                createPublicKey(keyString)
                return true
              } catch (err) {
                return false
              }
            }

            const signOptions = config.options.signOptions || {}
            if (!signOptions.algorithm) {
              if (!validPrivateKey(config.options.privateKey) || !validPublicKey(config.options.publicKey)) {
                throw new Error('The JWT PEM key was invalid')
              }
              signOptions.algorithm = 'RS256'
            }

            return {
              signOptions,
              publicKey: config.options.publicKey,
              privateKey: config.options.privateKey
            }
          }
        })
      ],
      module: JwtModule,
      providers: [optionsProvider, JwtService],
      exports: ['JWT_CONFIG_OPTIONS', JwtService]
    }
  }
}

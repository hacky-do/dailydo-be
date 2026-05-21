import * as Entities from '@data/domain'
import { UserModule } from '@data/domain/user'
import configuration from '@data/config'
import { onCloud } from '@data/lib'
import { AwsModule } from '@infra/aws'
import { SocialModule } from '@infra/social'
import KeyvRedis from '@keyv/redis'
import { CacheModule } from '@nestjs/cache-manager'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { MiddlewareModule } from '@nestjs/core/middleware/middleware-module'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { PassportModule } from '@nestjs/passport'
import { ThrottlerModule } from '@nestjs/throttler'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CookieModule } from '@system/cookie'
import { TypeormLogger } from '@system/database'
import { JwtModule } from '@system/jwt'
import { HttpExceptionFilter, ResponseInterceptor } from '@system/middlewares'
import { RedisOptions } from 'ioredis'
import Joi from 'joi'
import { UserHttpModule } from './controllers/user-http.module'
import { AuthenticationGuard } from './guards/authentication.guard'
import { AuthorizationGuard } from './guards/authorization.guard'
import { JwtStrategy } from './strategies/jwt.strategy'
import { UserApiController } from './user-api.controller'

const envFilePath = ['.env', '../../.env']

const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  USER_API_PORT: Joi.number().default(4000),
  HOST_API: Joi.string().optional(),
  HOST_WEB: Joi.string().optional(),
  COOKIE_DOMAIN: Joi.string().default('localhost'),
  CORS_ORIGIN: Joi.string().allow('').optional(),
  CORS_CREDENTIALS: Joi.boolean().default(true),
  DB_TYPE: Joi.string().valid('postgres').default('postgres'),
  DB_HOST: Joi.string().allow('').optional(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().allow('').optional(),
  DB_PASSWORD: Joi.string().allow('').optional(),
  DB_NAME: Joi.string().default('postgres'),
  DB_TIMEZONE: Joi.string().default('+00:00'),
  DB_CHARSET: Joi.string().default('utf8'),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  DB_SSL: Joi.boolean().default(false),
  REDIS_HOST: Joi.string().default('127.0.0.1'),
  REDIS_PORT: Joi.number().default(6379),
  AWS_REGION: Joi.string().default('ap-northeast-2'),
  AWS_ACCESS_KEY_ID: Joi.string().allow('').optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().allow('').optional(),
  AWS_BUCKET: Joi.string().default('dailydo-bucket'),
  AWS_UPLOAD_PREFIX: Joi.string().default('uploads'),
  JWT_PUBLIC_KEY: Joi.string().allow('').optional(),
  JWT_PRIVATE_KEY: Joi.string().allow('').optional(),
  SOCIAL_GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
  SOCIAL_GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional(),
  SOCIAL_NAVER_CLIENT_ID: Joi.string().allow('').optional(),
  SOCIAL_NAVER_CLIENT_SECRET: Joi.string().allow('').optional(),
  SOCIAL_GOOGLE_REDIRECT_URI: Joi.string().allow('').optional(),
  SOCIAL_NAVER_REDIRECT_URI: Joi.string().allow('').optional(),
  API_DOCS_AUTH_ID: Joi.string().default('backend'),
  API_DOCS_AUTH_PASSWORD: Joi.string().default('backend_1024'),
  DOCKERHUB_USERNAME: Joi.string().allow('').optional(),
  IMAGE_TAG: Joi.string().allow('').optional(),
  BATCH_PORT: Joi.number().optional()
})

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath,
      validationSchema
    }),
    AwsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const aws = configService.get('aws')
        return {
          region: aws.region,
          accessKeyId: aws.accessKeyId,
          secretAccessKey: aws.secretAccessKey,
          bucket: aws.bucket,
          uploadPrefix: aws.uploadPrefix,
          bucketPath: aws.bucketPath
        }
      }
    }),
    CookieModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        cookieDomain: configService.get('cookieDomain')
      })
    }),
    CacheModule.registerAsync<RedisOptions>({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redis = configService.get('redis')
        return {
          stores: [new KeyvRedis(`redis://${redis.host}:${redis.port}`, { namespace: '{backend}:' })]
        }
      }
    }),
    PassportModule,
    JwtModule.forRootAsync({
      imports: [],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redis = configService.get('redis')
        const jwt = configService.get('jwt')
        return {
          redis: {
            host: redis.host,
            port: redis.port,
            keyPrefix: '{backend}:'
          },
          options: {
            publicKey: jwt.publicKey,
            privateKey: jwt.privateKey
          }
        }
      }
    }),
    SocialModule.forRootAsync({
      imports: [],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const social = configService.get('social') ?? {}
        return {
          callbackUri: `${configService.get('host.api')}/auth/oauth2/code`,
          redirectUris: {
            google: configService.get('social.google.redirectUri') || 'http://localhost:3000/auth/callback/google',
            github: configService.get('social.github.redirectUri') || 'http://localhost:3000/auth/callback/github',
            kakao: configService.get('social.kakao.redirectUri') || 'http://localhost:3000/auth/callback/kakao',
            apple: configService.get('social.apple.redirectUri'),
            facebook: configService.get('social.facebook.redirectUri'),
            naver: configService.get('social.naver.redirectUri')
          },
          apple: social.apple,
          google: social.google,
          github: social.github,
          kakao: social.kakao,
          facebook: social.facebook,
          naver: social.naver
        }
      }
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const database = { ...configService.get('database') }
        if (onCloud) {
          database.synchronize = false
        }

        return {
          ...database,
          entities: Object.values(Entities),
          logger: new TypeormLogger(database.logging)
        }
      }
    }),
    EventEmitterModule.forRoot(),
    MiddlewareModule,
    ThrottlerModule.forRoot([
      {
        ttl: 1000,
        limit: 10
      }
    ]),
    UserHttpModule,
    UserModule
  ],
  controllers: [UserApiController],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard
    },
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter
    }
  ]
})
export class UserApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}

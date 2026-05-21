import * as Entities from '@data/domain'
import configuration from '@data/config'
import { onCloud } from '@data/lib'
import KeyvRedis from '@keyv/redis'
import { CacheModule } from '@nestjs/cache-manager'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { MiddlewareModule } from '@nestjs/core/middleware/middleware-module'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule } from '@nestjs/throttler'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TypeormLogger } from '@system/database'
import { HttpExceptionFilter, ResponseInterceptor } from '@system/middlewares'
import { RedisOptions } from 'ioredis'
import Joi from 'joi'
import { BatchController } from './batch.controller'
import { CronModule } from './cron/cron.module'

const envFilePath = ['.env', '../../.env']

const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  BATCH_PORT: Joi.number().default(4002),
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
  USER_API_PORT: Joi.number().optional(),
  DOCKERHUB_USERNAME: Joi.string().allow('').optional(),
  IMAGE_TAG: Joi.string().allow('').optional()
})

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath,
      validationSchema
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
    ScheduleModule.forRoot(),
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
    CronModule
  ],
  controllers: [BatchController],
  providers: [
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
export class BatchModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}

import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { LoggerService } from '@system/logger'
import path from 'path'
import { initializeApiDocs } from './api-docs'
import { UserApiModule } from './user-api.module'
import ejs from 'ejs'
import { LoggerMiddleware, RequestIdMiddleware } from '@system/middlewares'

function normalizePort(val: string | number) {
  let port = val
  if (typeof port === 'string') {
    port = Number.parseInt(port, 10)
  }
  if (Number.isNaN(port)) {
    return port
  }
  if (port >= 0) {
    return port
  }
  return 0
}

export const server = new FastifyAdapter({
  logger: false,
  trustProxy: true,
  bodyLimit: 1 * 1024 * 1024
})

const logger = new LoggerService(process.env.NODE_ENV === 'production' ? 'info' : 'debug', {
  excludeContexts: ['RoutesResolver', 'RouterExplorer', 'InstanceLoader']
})

export async function listen() {
  const port = normalizePort(process.env.USER_API_PORT ?? process.env.PORT ?? 4000) || 4000
  server.listen(port, '::', () => {
    const address = server.getHttpServer().address()
    const bind = typeof address === 'string' ? `pipe ${address}` : `port ${address.port}`
    logger.debug(`Listening on ${bind}`)
  })
}

export async function init() {
  const app = await NestFactory.create<NestFastifyApplication>(UserApiModule, server, {
    logger
  })
  const configService = app.get(ConfigService)

  await app.register(require('@fastify/cookie'))
  await app.register(require('@fastify/helmet'), {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })

  const cors = configService.get('cors')
  if (cors) app.enableCors(cors)
  app.useStaticAssets({ root: path.join(__dirname, 'public'), prefix: '/public/' })
  app.setViewEngine({ engine: { ejs }, templates: path.join(__dirname, 'views') })

  app.use(RequestIdMiddleware)
  app.use(
    LoggerMiddleware({
      logger: logger.getLogger(),
      ignorePatterns: ['/health', /^\/api-docs/, /^\/vendor\/api-docs/, /\.(ico|png|jpg|svg)$/],
      sensitiveFields: ['password', 'newPassword']
    })
  )

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      transform: true
    })
  )

  await initializeApiDocs(app)
  await app.init()

  return app
}

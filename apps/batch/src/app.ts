import { LoggerService } from '@system/logger'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { BatchModule } from './batch.module'

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
  trustProxy: true,
  bodyLimit: 1 * 1024 * 1024
})

const logger = new LoggerService(process.env.NODE_ENV === 'production' ? 'info' : 'debug', {
  excludeContexts: ['RoutesResolver', 'RouterExplorer', 'InstanceLoader']
})

export async function listen() {
  const port = normalizePort(process.env.BATCH_PORT ?? process.env.PORT ?? 4002) || 4002
  server.listen(port, '::', () => {
    const address = server.getHttpServer().address()
    const bind = typeof address === 'string' ? `pipe ${address}` : `port ${address.port}`
    logger.debug(`Listening on ${bind}`)
  })
}

export async function init() {
  const app = await NestFactory.create<NestFastifyApplication>(BatchModule, server, {
    logger
  })
  await app.register(require('@fastify/helmet'), {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
  await app.init()
  return app
}

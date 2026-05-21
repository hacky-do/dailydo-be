import { onCloud } from '@data/lib'
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common'
import { getRequestId } from '@system/middlewares'
import { blue, gray, green, magenta, red, yellow } from 'colorette'
import pino, { Logger, LoggerOptions, stdTimeFunctions } from 'pino'
import pretty from 'pino-pretty'

const levelColor = {
  trace: gray,
  debug: blue,
  info: green,
  warn: yellow,
  error: red,
  fatal: magenta
}

const stream = pretty({
  colorize: false,
  colorizeObjects: false,
  levelFirst: false,
  hideObject: true,
  translateTime: `yyyy-mm-dd'T'HH:MM:ss.l'Z'`,
  messageFormat: (log: any, messageKey) => {
    const color = levelColor[log.level]
    let message = `[${log.time}][${log.level.toUpperCase()}]`
    if (log.context) message += `[${log.context}]`
    message = `${color(message)} - ${log[messageKey]}`
    return message
  },
  customPrettifiers: {
    time: () => '',
    level: () => ''
  }
})

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: Logger
  private readonly includeContexts?: string[]
  private readonly excludeContexts: string[]

  constructor(level: string, options: { includeContexts?: string[]; excludeContexts?: string[] } = {}) {
    this.includeContexts = options.includeContexts
    this.excludeContexts = options.excludeContexts

    const pinoConfig: LoggerOptions = {
      base: null,
      level,
      messageKey: 'log',
      timestamp: stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => {
          return { level: label }
        }
      },
      redact: {
        paths: ['req', 'res', 'err'],
        remove: true
      },
      mixin: () => {
        const requestId = getRequestId()
        return requestId ? { requestId } : {}
      }
    }
    if (onCloud) {
      this.logger = pino(pinoConfig)
    } else {
      this.logger = pino(pinoConfig, stream)
    }
  }

  getLogger() {
    return this.logger
  }

  trace(message: any, context?: string) {
    if (!this.shouldLog(context)) return
    this.logger.trace({ context }, this.parseMessage(message))
  }

  debug(message: any, context?: string) {
    this.logger.debug({ context }, this.parseMessage(message))
  }

  log(message: any, context?: string) {
    if (!this.shouldLog(context)) return
    this.logger.info({ context }, this.parseMessage(message))
  }

  info(message: any, context?: string) {
    if (!this.shouldLog(context)) return
    this.logger.info({ context }, this.parseMessage(message))
  }

  warn(message: any, context?: string) {
    if (!this.shouldLog(context)) return
    this.logger.warn({ context }, this.parseMessage(message))
  }

  error(message: any, stack?: string, context?: string) {
    if (!this.shouldLog(context)) return
    this.logger.error({ context }, this.parseMessage(message))
  }

  fatal(message: any, stack?: string, context?: string) {
    if (!this.shouldLog(context)) return
    this.logger.fatal({ context }, this.parseMessage(message))
  }

  private shouldLog(context?: string) {
    if (this.excludeContexts?.includes(context || '')) {
      return false
    }
    if (this.includeContexts) {
      return this.includeContexts.includes(context || '')
    }
    return true
  }

  private parseMessage(message: any) {
    if (message instanceof Error) {
      const err = pino.stdSerializers.err(message)
      return err.stack || err.message
    }
    return message
  }
}

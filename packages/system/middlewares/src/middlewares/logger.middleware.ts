import { onCloud } from '@data/lib'
import { HttpStatus, Logger as NestLogger } from '@nestjs/common'
import { FastifyRequest, FastifyReply } from 'fastify'
import { Logger } from 'pino'
import pinoHttp from 'pino-http'

const LOG_CONTEXT = 'HTTP'

export function LoggerMiddleware(options: {
  logger: Logger
  ignorePatterns: (string | RegExp)[]
  sensitiveFields?: string[]
}) {
  const { logger, sensitiveFields = ['password', 'newPassword'] } = options

  const nestLogger = new NestLogger(LOG_CONTEXT)

  const maskSensitiveData = (body: any) => {
    if (!body || Object.keys(body).length === 0) return ''
    const maskedBody = structuredClone(body)
    Object.keys(maskedBody).forEach((key) => {
      if (sensitiveFields.some((field) => key.includes(field))) {
        maskedBody[key] = '******'
      }
    })
    return JSON.stringify(maskedBody)
  }

  return (req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) => {
    pinoHttp({
      logger,
      wrapSerializers: false,
      autoLogging: {
        ignore: (req) => {
          return options.ignorePatterns.some((pattern) => {
            return typeof pattern === 'string' ? req.url.startsWith(pattern) : pattern.test(req.url)
          })
        }
      },
      customProps: (req: any, res: any) => {
        return {
          userId: req.user?.id,
          userRole: req.user?.role,
          remoteAddress: req.ip || req._remoteAddress || req.connection?.remoteAddress,
          method: req.method,
          url: req.url,
          httpVersion: req.httpVersion,
          status: res.statusCode,
          host: req.headers.host,
          contentLength: res.getHeader('content-length'),
          referrer: req.headers.referer,
          userAgent: req.headers['user-agent']
        }
      },
      customLogLevel(req, res, err) {
        if (res.statusCode >= 400 && res.statusCode < 500) return 'error'
        if (res.statusCode >= 500 || err) return 'fatal'
        return 'info'
      },
      customSuccessObject: (req, res, val) => {
        return {
          ...val,
          context: LOG_CONTEXT
        }
      },
      customErrorObject: (req, res, error, val) => {
        return {
          ...val,
          context: LOG_CONTEXT
        }
      },
      customSuccessMessage(req, res, responseTime) {
        const body = maskSensitiveData(req.body)
        return `"${req.method} ${req.url}" ${res.statusCode} ${responseTime || 0}ms${body ? ` - ${body}` : ''}`
      },
      customErrorMessage(req, res, err, responseTime) {
        const errorData = { status: res.statusCode, url: req.url, method: req.method }
        const message = err?.response?.message || err
        if (res.statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
          nestLogger.fatal(err.stack, errorData)
        } else if (!onCloud) {
          nestLogger.error(err.stack, errorData)
        } else if (process.env.NODE_ENV !== 'production' && res.statusCode !== HttpStatus.INTERNAL_SERVER_ERROR) {
          nestLogger.error(message, errorData)
        }
        const body = maskSensitiveData(req.body)
        return `"${req.method} ${req.url}" ${res.statusCode} ${responseTime || 0}ms${body ? ` - ${body}` : ''}`
      }
    } as any)(req, res, next)
  }
}

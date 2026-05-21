import { Logger } from '@nestjs/common'
import { gray, red, underline, yellow } from 'colorette'
import { AbstractLogger, LoggerOptions, LogLevel, LogMessage, QueryRunner } from 'typeorm'

export class TypeormLogger extends AbstractLogger {
  private readonly logger = new Logger('DB')

  constructor(protected options?: LoggerOptions) {
    super(options)
  }

  protected writeLog(level: LogLevel, logMessage: LogMessage | LogMessage[], queryRunner?: QueryRunner) {
    const messages = this.prepareLogMessages(logMessage, {
      highlightSql: true,
      addColonToPrefix: true
    })

    for (const message of messages) {
      switch (message.type ?? level) {
        case 'log':
        case 'schema-build':
        case 'migration':
          this.logger.log(message.message)
          break

        case 'info':
        case 'query':
          if (message.prefix) {
            this.logger.debug(`${underline(gray(message.prefix))} ${message.message}`)
          } else {
            this.logger.debug(message.message)
          }
          break

        case 'warn':
        case 'query-slow':
          if (message.prefix) {
            this.logger.warn(`${underline(yellow(message.prefix))} ${message.message}`)
          } else {
            this.logger.warn(message.message)
          }
          break

        case 'error':
        case 'query-error': {
          let msg = message.message as any
          if (msg instanceof Error) {
            msg = msg.message
          }
          if (message.prefix) {
            this.logger.error(`${underline(red(message.prefix))} ${msg}`)
          } else {
            this.logger.error(msg)
          }
          break
        }
      }
    }
  }
}

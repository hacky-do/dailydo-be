import { getRequestId } from '@system/middlewares'
import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common'
import { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { get, set } from 'es-toolkit/compat'
import type { HttpLoggerOptions } from './http-logger.options'

export interface RequestMetadata extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number
  }
}

@Injectable()
export class HttpLoggerService {
  private readonly logger = new Logger('http')
  private readonly defaultOptions: Omit<HttpLoggerOptions, 'logger'> = {
    prefix: 'HTTP',
    level: 'info',
    includeRequestBody: true,
    includeResponseBody: false,
    includeHeaders: false,
    maxBodyLength: 1000,
    sensitiveHeaders: ['authorization', 'cookie', 'x-api-key']
  }

  private readonly options: Omit<HttpLoggerOptions, 'logger'>

  constructor(@Inject('HTTP_LOGGER_CONFIG') private readonly config: HttpLoggerOptions) {
    this.options = { ...this.defaultOptions, ...config }
  }

  createAxiosLogger() {
    const responseHandler = {
      onSuccess: (response: AxiosResponse) => {
        const requestConfig = response.config as RequestMetadata
        const duration = new Date().getTime() - (requestConfig.metadata?.startTime || 0)
        if (this.shouldLog(requestConfig, response.status)) {
          const url = response.request?.res?.responseUrl || ''
          const message = this.formatLogMessage(requestConfig.method || 'UNKNOWN', url, response.status, duration, {
            level: this.options.level,
            requestHeaders: this.options.includeHeaders ? requestConfig.headers : undefined,
            requestBody: this.options.includeRequestBody ? requestConfig.data : undefined,
            responseHeaders: this.options.includeHeaders ? response.headers : undefined,
            responseBody: this.options.includeResponseBody ? response.data : undefined
          })

          this.logWithLevel(this.options.level, message, {
            httpService: this.options.prefix,
            requestId: getRequestId(),
            status: response.status,
            url,
            method: requestConfig.method || ''
          })
        }
        return response
      },
      onError: (e: AxiosError) => {
        const requestConfig = e.config as RequestMetadata
        const duration = new Date().getTime() - (requestConfig?.metadata?.startTime || 0)
        const url = e.response?.request?.res?.responseUrl || ''

        if (!url) {
          this.logWithLevel('error', e.message)
        } else if (this.shouldLog(requestConfig, e.response?.status)) {
          const message = this.formatLogMessage(requestConfig?.method || 'UNKNOWN', url, e.response?.status, duration, {
            level: 'error',
            requestHeaders: this.options.includeHeaders ? requestConfig?.headers : undefined,
            requestBody: this.options.includeRequestBody ? requestConfig?.data : undefined,
            responseHeaders: this.options.includeHeaders ? e.response?.headers : undefined,
            responseBody: e.response?.data,
            includeResponseBody: true
          })
          this.logWithLevel('error', message, {
            httpService: this.options.prefix,
            requestId: getRequestId(),
            status: e.response?.status || 0,
            url,
            method: requestConfig.method || ''
          })
        }
        this.options.error?.errorHandler(e)
        throw e
      }
    }

    return {
      requestInterceptor: (config: InternalAxiosRequestConfig) => {
        const requestConfig = config as RequestMetadata
        requestConfig.metadata = { startTime: new Date().getTime() }
        return requestConfig
      },

      responseInterceptor: async (response: AxiosResponse) => {
        try {
          const res = this.options.error.responseHandler?.(response) || response
          return responseHandler.onSuccess(res)
        } catch (responseError) {
          const errorMessage = responseError.message || 'API Error'
          const error = new Error(errorMessage) as AxiosError
          error.response = response
          error.config = response.config
          try {
            responseHandler.onError(error)
          } catch (e) {
            throw responseError
          }
        }
      },
      errorInterceptor: responseHandler.onError
    }
  }

  applyToAxiosInstance(instance: AxiosInstance): AxiosInstance {
    const logger = this.createAxiosLogger()
    instance.interceptors.request.use(logger.requestInterceptor)
    instance.interceptors.response.use(logger.responseInterceptor, logger.errorInterceptor)
    return instance
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers }
    this.options.sensitiveHeaders?.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '******'
      }
    })

    return sanitized
  }

  private sanitizeBody(body: any): string {
    let sanitized: any
    if (typeof body === 'string') {
      try {
        sanitized = JSON.parse(body)
      } catch (e) {
        sanitized = body
      }
    } else {
      sanitized = structuredClone(body)
    }
    if (!this.options.sensitiveFields) {
      return this.truncateBody(sanitized)
    }
    this.options.sensitiveFields?.forEach((path) => {
      if (get(sanitized, path) !== undefined) {
        set(sanitized, path, '******')
      }
    })
    return this.truncateBody(sanitized)
  }

  private truncateBody(body: any): string {
    const stringified = JSON.stringify(body)
    if (stringified.length <= (this.options.maxBodyLength || 1000)) {
      return stringified
    }
    return stringified.substring(0, this.options.maxBodyLength) + '... (truncated)'
  }

  private shouldLog(config: InternalAxiosRequestConfig, status?: number): boolean {
    const { filters } = this.options
    if (!filters) return true

    if (filters.urls && !filters.urls.some((pattern) => pattern.test(config.url || ''))) {
      return false
    }

    if (filters.methods && !filters.methods.includes(config.method?.toUpperCase() || '')) {
      return false
    }

    return !(status && filters.status && !filters.status.includes(status))
  }

  private formatLogMessage(
    method: string,
    url: string,
    status: number | undefined,
    duration: number,
    extras: {
      level: HttpLoggerOptions['level']
      includeResponseBody?: boolean
      requestHeaders?: Record<string, any>
      requestBody?: any
      responseHeaders?: unknown
      responseBody?: any
    }
  ): string {
    const includeResponseBody = extras.includeResponseBody ?? this.options.includeResponseBody
    const prefix = `[${this.options.prefix}]`
    const parts = [prefix, `"${method.toUpperCase()}`, `${url}"`, status, `${duration}ms`]

    if (this.options.includeHeaders) {
      if (extras.requestHeaders) {
        parts.push('\n' + 'Request Headers:', JSON.stringify(this.sanitizeHeaders(extras.requestHeaders), null, 2))
      }
    }

    if (this.options.includeRequestBody && extras.requestBody) {
      parts.push('-', this.sanitizeBody(extras.requestBody))
    }

    if (includeResponseBody && extras.responseBody) {
      parts.push('\n' + 'Response Body:', this.sanitizeBody(extras.responseBody))
    }

    return parts.filter(Boolean).join(' ')
  }

  private logWithLevel(
    level: HttpLoggerOptions['level'],
    message: string,
    data?: {
      httpService: string
      requestId: string
      status: number
      url: string
      method: string
    }
  ) {
    switch (level) {
      case 'debug':
        this.logger.debug(message, data)
        break
      case 'warn':
        this.logger.warn(message, data)
        break
      case 'error':
        this.logger.error(message, data)
        break
      case 'fatal':
        this.logger.fatal(message, data)
        break
      case 'info':
      default:
        this.logger.log(message, data)
    }
  }
}

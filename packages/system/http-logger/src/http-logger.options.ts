import { type ModuleMetadata } from '@nestjs/common'
import { type AxiosResponse } from 'axios'

export interface HttpLoggerOptions {
  prefix: string
  level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  includeRequestBody?: boolean
  includeResponseBody?: boolean
  includeHeaders?: boolean
  filters?: {
    urls?: RegExp[]
    methods?: string[]
    status?: number[]
  }
  error?: {
    responseHandler?: (response: AxiosResponse) => AxiosResponse
    errorHandler?: (error: Error) => any
  }
  maxBodyLength?: number
  sensitiveHeaders?: string[]
  sensitiveFields?: string[]
}

export interface HttpLoggerAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => Promise<HttpLoggerOptions>
  inject?: any[]
}

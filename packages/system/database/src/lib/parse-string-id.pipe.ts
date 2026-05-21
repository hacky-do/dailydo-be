import { HttpStatus, Injectable, Optional, PipeTransform } from '@nestjs/common'
import { ErrorHttpStatusCode, HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util'

export interface ParseStringIdPipeOptions {
  errorHttpStatusCode?: ErrorHttpStatusCode
  exceptionFactory?: (error: string) => any
}

@Injectable()
export class ParseStringIdPipe implements PipeTransform<string> {
  protected exceptionFactory: (error: string) => any

  constructor(@Optional() options?: ParseStringIdPipeOptions) {
    options = options || {}
    const { exceptionFactory, errorHttpStatusCode = HttpStatus.BAD_REQUEST } = options

    this.exceptionFactory = exceptionFactory || ((error) => new HttpErrorByCode[errorHttpStatusCode](error))
  }

  async transform(value: string): Promise<string> {
    if (!this.isNumeric(value)) {
      throw this.exceptionFactory('Validation failed (positive numeric string is expected)')
    }
    return value
  }

  protected isNumeric(value: string): boolean {
    return ['string', 'number'].includes(typeof value) && /^\d+$/.test(value) && isFinite(value as any)
  }
}

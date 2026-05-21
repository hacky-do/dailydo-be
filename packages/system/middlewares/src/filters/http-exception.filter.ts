import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { getRequestId } from '../middlewares/request-id.middleware'
import { HttpAdapterHost } from '@nestjs/core'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    response.raw.err = exception

    let status: number
    let message: string
    let info: any
    const body: any = { requestId: getRequestId() }

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionBody = exception.getResponse()
      if (typeof exceptionBody === 'string') {
        message = exceptionBody
      } else if (exceptionBody) {
        message = exceptionBody['message']
        info = exceptionBody['info']
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message = exception.message
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR
    }
    if (Array.isArray(message)) {
      body.message = message.join(', ')
    } else {
      body.message = message
    }
    body.info = info
    if (
      process.env.NODE_ENV !== 'production' &&
      status === HttpStatus.INTERNAL_SERVER_ERROR &&
      exception instanceof Error
    ) {
      body.stack = exception.stack
    }
    if (message === 'invalid_session' && request.session) {
      request.session.destroy()
    }
    httpAdapter.reply(ctx.getResponse(), body, status)
  }
}

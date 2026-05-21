import { SWAGGER_API_RESPONSE_KEY } from '../decorators'
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
  PlainLiteralObject,
  ValidationPipe
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { instanceToPlain, plainToClass } from 'class-transformer'
import { validate } from 'class-validator'
import { ValidationError } from 'class-validator/types/validation/ValidationError'
import { FastifyReply } from 'fastify'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly exceptionFactory: (errors: ValidationError[]) => any

  constructor(private readonly reflector: Reflector) {
    const validationPipe = new ValidationPipe({
      validationError: { target: false, value: false },
      transform: true,
      forbidUnknownValues: true,
      whitelist: true
    })
    this.exceptionFactory = validationPipe.createExceptionFactory()
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    try {
      return next.handle().pipe(
        map(async (data: PlainLiteralObject | Array<PlainLiteralObject>) => {
          const apiResponse = this.reflector.getAllAndOverride<any>(SWAGGER_API_RESPONSE_KEY, [
            context.getHandler(),
            context.getClass()
          ])
          const res = context.switchToHttp().getResponse<FastifyReply>()
          if (typeof data === 'object' && apiResponse[res.statusCode]?.type?.constructor) {
            const classObject: any = plainToClass(apiResponse[res.statusCode].type, instanceToPlain({ ...data }))
            const errors: ValidationError[] = await validate(classObject, {
              validationError: { target: false, value: false },
              forbidUnknownValues: true,
              whitelist: true
            })
            if (process.env.NODE_ENV !== 'production' && errors.length) {
              const resError = await this.exceptionFactory(errors)
              throw new InternalServerErrorException(resError.response)
            }
            return classObject
          }
          return data
        })
      )
    } catch (e) {
      throw e
    }
  }
}

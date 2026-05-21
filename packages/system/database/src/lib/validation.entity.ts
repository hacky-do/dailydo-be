import { ValidationPipe } from '@nestjs/common'
import { validateOrReject } from 'class-validator'
import { BeforeInsert, BeforeUpdate } from 'typeorm'

export abstract class ValidationEntity {
  @BeforeInsert()
  @BeforeUpdate()
  async validateEntity(): Promise<void> {
    try {
      await validateOrReject(this, {
        validationError: { target: false, value: false },
        skipUndefinedProperties: true,
        forbidUnknownValues: true,
        whitelist: true
      })
    } catch (e) {
      throw new ValidationPipe().createExceptionFactory()(e)
    }
  }
}

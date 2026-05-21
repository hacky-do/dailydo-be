import { applyDecorators } from '@nestjs/common'
import { Transform } from 'class-transformer'
import {
  Length,
  Validate,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator'

@ValidatorConstraint({ name: 'isCurrencyCode', async: false })
class CodeValidator implements ValidatorConstraintInterface {
  validate(value: any) {
    if (typeof value !== 'string') return false
    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' })
      const label = displayNames.of(value)
      return !!label && label !== value
    } catch {
      return false
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid ISO 4217 currency code (e.g., "USD", "EUR")`
  }
}

export function IsCurrencyCode(validationOptions?: ValidationOptions) {
  return applyDecorators(
    Length(3, 3),
    Transform(({ value }) => (value && typeof value === 'string' ? value.toUpperCase() : value)),
    Validate(CodeValidator)
  )
}

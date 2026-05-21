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

@ValidatorConstraint({ name: 'isCountryCode', async: false })
class CodeValidator implements ValidatorConstraintInterface {
  validate(value: any) {
    if (typeof value !== 'string') return false
    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
      const label = displayNames.of(value)
      return !!label && label !== value
    } catch {
      return false
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid ISO 3166-1 alpha-2 country code (e.g., "US", "KR")`
  }
}

export function IsCountryCode(validationOptions?: ValidationOptions) {
  return applyDecorators(
    Length(2, 2),
    Transform(({ value }) => (value && typeof value === 'string' ? value.toUpperCase() : value)),
    Validate(CodeValidator)
  )
}

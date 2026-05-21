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

@ValidatorConstraint({ name: 'isLanguageCode', async: false })
class CodeValidator implements ValidatorConstraintInterface {
  validate(value: any) {
    if (typeof value !== 'string') return false
    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'language' })
      const label = displayNames.of(value)
      return !!label && label !== value
    } catch {
      return false
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid ISO 639-1 language code (e.g., "en", "ko")`
  }
}

export function IsLanguageCode(validationOptions?: ValidationOptions) {
  return applyDecorators(
    Length(2, 2),
    Transform(({ value }) => (value && typeof value === 'string' ? value.toLowerCase() : value)),
    Validate(CodeValidator)
  )
}

import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

export function IsDateFormat(format?: string | ValidationOptions, validationOptions?: ValidationOptions) {
  let dateFormat = 'YYYY-MM-DD'
  let options = validationOptions

  if (typeof format === 'object') {
    options = format
  } else if (typeof format === 'string') {
    dateFormat = format
  }
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isDateFormat',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [dateFormat],
      options: {
        message: `${propertyName} must be in the format ${dateFormat}`,
        ...options
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [format] = args.constraints
          if (typeof value !== 'string') {
            return false
          }
          return dayjs(value, format, true).isValid()
        },
        defaultMessage(args: ValidationArguments) {
          const [format] = args.constraints
          return `${args.property} must be a valid date in the format ${format}`
        }
      }
    })
  }
}

import { registerDecorator, ValidationOptions } from 'class-validator'

export function IsOnlyDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsOnlyDate',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'Please provide only date like yyyy-MM-dd',
        ...validationOptions
      },
      validator: {
        validate(value: any) {
          const regex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/
          return typeof value === 'string' && regex.test(value)
        }
      }
    })
  }
}

export function IsOnlyMonth(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsOnlyMonth',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'Please provide only date like yyyy-MM-dd',
        ...validationOptions
      },
      validator: {
        validate(value: any) {
          const regex = /([12]\d{3}-(0[1-9]|1[0-2]))$/
          return typeof value === 'string' && regex.test(value)
        }
      }
    })
  }
}

export function IsMultipleOf(multipleOf: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsMultipleOf',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: `Please provide multipleOf ${multipleOf}`,
        ...validationOptions
      },
      validator: {
        validate(value: any) {
          return value % multipleOf === 0
        }
      }
    })
  }
}

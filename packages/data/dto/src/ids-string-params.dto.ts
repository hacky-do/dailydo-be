import { Transform } from 'class-transformer'
import { ArrayNotEmpty, isArray, IsNumberString } from 'class-validator'

export class IdsStringParamsDto {
  @ArrayNotEmpty()
  @IsNumberString({ no_symbols: true }, { each: true })
  @Transform(({ value }) => (isArray(value) ? value : [value]))
  ids: string[]

  constructor(partial: Partial<IdsStringParamsDto>) {
    Object.assign(this, partial)
  }
}

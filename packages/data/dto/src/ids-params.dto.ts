import { Transform, Type } from 'class-transformer'
import { ArrayNotEmpty, isArray, IsInt } from 'class-validator'

export class IdsParamsDto {
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  @Transform(({ value }) => (isArray(value) ? value : [value]))
  ids: number[]

  constructor(partial: Partial<IdsParamsDto>) {
    Object.assign(this, partial)
  }
}

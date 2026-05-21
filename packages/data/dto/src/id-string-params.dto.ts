import { IsNumberString } from 'class-validator'

export class IdStringParamsDto {
  @IsNumberString({ no_symbols: true })
  id: string

  constructor(partial: Partial<IdStringParamsDto>) {
    Object.assign(this, partial)
  }
}

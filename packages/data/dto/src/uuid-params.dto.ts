import { IsUUID } from 'class-validator'

export class UuidParamsDto {
  @IsUUID()
  id: string

  constructor(partial: Partial<UuidParamsDto>) {
    Object.assign(this, partial)
  }
}

import { ArgumentMetadata, Injectable, ParseIntPipe } from '@nestjs/common'

@Injectable()
export class OptionalParseIntPipe extends ParseIntPipe {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (value === undefined) {
      return value
    }
    return super.transform(value, metadata)
  }
}

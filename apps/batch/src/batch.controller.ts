import { Public } from '@data/decorators'
import { Controller, Get } from '@nestjs/common'
import { ApiExcludeEndpoint } from '@nestjs/swagger'

@Public()
@Controller()
export class BatchController {
  constructor() {}

  @ApiExcludeEndpoint()
  @Get('health')
  async health() {}
}

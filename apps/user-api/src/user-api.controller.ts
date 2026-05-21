import { Public } from '@data/decorators'
import { Controller, Get, Header } from '@nestjs/common'

@Public()
@Controller()
export class UserApiController {
  @Get('health')
  async health() {}

  @Get('favicon.ico')
  @Header('Content-Type', 'image/x-icon')
  getFavicon() {
    return ''
  }
}

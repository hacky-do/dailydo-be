import { MyLogModule } from '@data/domain/my-log/my-log.module'
import { Module } from '@nestjs/common'

import { MylogsController } from './mylogs.controller'

@Module({
  imports: [MyLogModule],
  controllers: [MylogsController],
})
export class MylogsHttpModule {}

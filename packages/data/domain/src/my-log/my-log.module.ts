import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { DailyMissionItem } from '../daily-mission/daily-mission-item.entity'
import { MyLog } from './my-log.entity'
import { MyLogService } from './my-log.service'

@Module({
  imports: [TypeOrmModule.forFeature([MyLog, DailyMissionItem])],
  providers: [MyLogService],
  exports: [TypeOrmModule, MyLogService],
})
export class MyLogModule {}

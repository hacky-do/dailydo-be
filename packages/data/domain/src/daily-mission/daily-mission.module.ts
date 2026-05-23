import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { MissionCategory } from '../mission-category/mission-category.entity'
import { MissionModule } from '../mission/mission.module'
import { MyLog } from '../my-log/my-log.entity'
import { DailyMissionItem } from './daily-mission-item.entity'
import { DailyMission } from './daily-mission.entity'
import { DailyMissionService } from './daily-mission.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyMission, DailyMissionItem, MissionCategory, MyLog]),
    MissionModule,
  ],
  providers: [DailyMissionService],
  exports: [TypeOrmModule, DailyMissionService],
})
export class DailyMissionModule {}

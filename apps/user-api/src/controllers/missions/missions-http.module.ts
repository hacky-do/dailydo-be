import { DailyMissionModule } from '@data/domain/daily-mission/daily-mission.module'
import { Module } from '@nestjs/common'

import { MissionsController } from './missions.controller'

@Module({
  imports: [DailyMissionModule],
  controllers: [MissionsController],
})
export class MissionsHttpModule {}

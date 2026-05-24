import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Mission } from './mission.entity'
import { MissionService } from './mission.service'
import { UserMissionStat } from './user-mission-stat.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Mission, UserMissionStat])],
  providers: [MissionService],
  exports: [TypeOrmModule, MissionService],
})
export class MissionModule {}

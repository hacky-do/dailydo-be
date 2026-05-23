import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { MissionCategory } from './mission-category.entity'

@Module({
  imports: [TypeOrmModule.forFeature([MissionCategory])],
  exports: [TypeOrmModule],
})
export class MissionCategoryModule {}

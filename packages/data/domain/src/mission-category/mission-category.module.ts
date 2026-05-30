import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { MissionCategory } from './mission-category.entity'
import { MissionCategoryService } from './mission-category.service'

@Module({
  imports: [TypeOrmModule.forFeature([MissionCategory])],
  providers: [MissionCategoryService],
  exports: [TypeOrmModule, MissionCategoryService],
})
export class MissionCategoryModule {}

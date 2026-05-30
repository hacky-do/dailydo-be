import { MissionCategory } from '@data/domain'
import { MissionCategoryService } from '@data/domain/mission-category'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MissionCategoriesController } from './mission-categories.controller'

@Module({
  imports: [TypeOrmModule.forFeature([MissionCategory])],
  controllers: [MissionCategoriesController],
  providers: [MissionCategoryService],
})
export class MissionCategoriesHttpModule {}

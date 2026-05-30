import { MissionCategory, UserMissionCategory } from '@data/domain'
import { UserCategoryService } from '@data/domain/user'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserCategoriesController } from './user-categories.controller'

@Module({
  imports: [TypeOrmModule.forFeature([MissionCategory, UserMissionCategory])],
  controllers: [UserCategoriesController],
  providers: [UserCategoryService],
})
export class UserCategoriesHttpModule {}

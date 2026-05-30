import { User, UserAccount, UserMissionCategory, UserPassword, UserSetting } from '..'
import { SocialModule } from '@infra/social'
import { AwsModule } from '@infra/aws'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MissionCategory } from '../mission-category/mission-category.entity'
import { UserCategoryService } from './user-category.service'
import { UserService } from './user.service'
import { Verification } from '../verification/verification.entity'

@Module({
  imports: [
    AwsModule,
    SocialModule,
    TypeOrmModule.forFeature([
      User,
      UserAccount,
      UserPassword,
      UserSetting,
      UserMissionCategory,
      MissionCategory,
      Verification,
    ])
  ],
  providers: [UserService, UserCategoryService],
  exports: [TypeOrmModule, UserService, UserCategoryService]
})
export class UserModule {}

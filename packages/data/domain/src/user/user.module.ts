import { User, UserAccount, UserPassword, UserSetting } from '..'
import { SocialModule } from '@infra/social'
import { AwsModule } from '@infra/aws'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserService } from './user.service'
import { Verification } from '../verification/verification.entity'

@Module({
  imports: [
    AwsModule,
    SocialModule,
    TypeOrmModule.forFeature([User, UserAccount, UserPassword, UserSetting, Verification])
  ],
  providers: [UserService],
  exports: [TypeOrmModule, UserService]
})
export class UserModule {}

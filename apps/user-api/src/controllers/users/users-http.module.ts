import { User, UserAccount } from '@data/domain'
import { UserService } from '@data/domain/user'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AwsModule } from '@infra/aws'
import { UsersController } from './users.controller'

@Module({
  imports: [AwsModule, TypeOrmModule.forFeature([User, UserAccount])],
  controllers: [UsersController],
  providers: [UserService],
  exports: [UserService]
})
export class UsersHttpModule {}

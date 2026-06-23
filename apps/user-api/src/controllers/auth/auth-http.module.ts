import { CollectionModule } from '@data/domain/collection'
import { UserModule } from '@data/domain/user'
import { Module } from '@nestjs/common'
import { AwsModule } from '@infra/aws'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  imports: [AwsModule, UserModule, CollectionModule],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthHttpModule {}

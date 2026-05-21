import { UserModule } from '@data/domain/user'
import { Module } from '@nestjs/common'
import { AwsModule } from '@infra/aws'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  imports: [AwsModule, UserModule],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthHttpModule {}

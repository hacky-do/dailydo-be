import { VerificationModule } from '@data/domain/verification'
import { Module } from '@nestjs/common'
import { VerificationsController } from './verifications.controller'

@Module({
  imports: [VerificationModule],
  controllers: [VerificationsController]
})
export class VerificationsHttpModule {}

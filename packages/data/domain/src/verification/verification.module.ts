import { UserModule } from '../user/user.module'
import { Verification } from './verification.entity'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { VerificationService } from './verification.service'

@Module({
  imports: [TypeOrmModule.forFeature([Verification]), UserModule],
  providers: [VerificationService],
  exports: [TypeOrmModule, VerificationService]
})
export class VerificationModule {}

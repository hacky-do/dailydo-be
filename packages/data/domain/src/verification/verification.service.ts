import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { JwtService } from '@system/jwt'
import { Repository } from 'typeorm'
import { UserService } from '../user'
import { Verification, VerificationType } from './verification.entity'
import { generateRandomCode } from '@data/lib'

@Injectable()
export class VerificationService {
  static readonly AUDIENCE = 'verification'

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>
  ) {}

  async create(options: { forAndroid: boolean; type: VerificationType; phone?: string; email?: string }) {
    const { type, phone, email } = options
    const user = await this.userService.findByEmailOrPhone({ phone, email })
    if (type === 'register' || type === 'changePhone') {
      if (user) throw new ConflictException('already_in_use')
    } else {
      if (!user) throw new NotFoundException('not_found')
    }

    const verification = await this.createWithCode(type, { phone, email })
    const exp = Math.floor(Date.now() / 1000) + 5 * 60
    const expireAt = new Date(exp * 1000)
    const codeToken = await this.jwtService.createToken({
      sub: verification.id.toString(),
      exp,
      aud: VerificationService.AUDIENCE
    })
    const ret: any = { codeToken, expireAt }
    if (process.env.NODE_ENV !== 'production') {
      ret.code = verification.code
    }
    //await this.popbillService.sendVerificationCode(phone, verification.code, forAndroid)
    return ret
  }

  async confirm(code: string, codeToken: string): Promise<string> {
    try {
      const { sub: id } = await this.jwtService.verifyToken(codeToken, { audience: VerificationService.AUDIENCE })
      const verification = await this.verificationRepository.findOne({ where: { id, used: false } })
      if (verification) {
        const { code: savedCode } = verification
        if (code === savedCode) {
          await this.verificationRepository.update(id, { confirmed: true })
          const exp = Math.floor(Date.now() / 1000) + 30 * 60
          return await this.jwtService.createToken({ sub: id, exp, aud: VerificationService.AUDIENCE })
        }
        throw new UnauthorizedException('wrong_code')
      }
      throw new UnauthorizedException('expired_token')
    } catch (e) {
      if (e.message === 'invalid_token') {
        throw new UnauthorizedException('invalid_token')
      }
      throw e
    }
  }

  private async createWithCode(type: VerificationType, options: { phone?: string; email?: string }) {
    const code = generateRandomCode(6).toString()
    const verification = new Verification({ type, code, ...options })
    await this.verificationRepository.save(verification)
    return verification
  }
}

import { User, UserAccount, UserPassword, UserSetting, Verification } from '@data/domain'
import { UserAccountType, UserService } from '@data/domain/user'
import { VERIFICATION_AUDIENCE } from '@data/domain/verification'
import { createPasswordHash, passwordIterations, verifyPassword } from '@data/lib'
import { SocialService } from '@infra/social'
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { JwtService } from '@system/jwt'
import { DataSource, Repository } from 'typeorm'
import { JwtStrategy } from '../../strategies/jwt.strategy'

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPassword)
    private readonly userPasswordRepository: Repository<UserPassword>,
    @InjectRepository(UserAccount)
    private readonly userAccountRepository: Repository<UserAccount>,
    @InjectRepository(Verification)
    private readonly verificationRepository: Repository<Verification>,
    private readonly socialService: SocialService,
    private readonly userService: UserService
  ) {}

  async register(options: {
    type: string
    email?: string
    phone?: string
    codeToken?: string
    socialToken?: string
    password?: string
    name?: string
    profileImage?: string
    description?: string
    agreeMarketing: boolean
  }) {
    const { type, email, phone, codeToken, socialToken, password, agreeMarketing, ...rest } = options
    if (type === 'email' && !email) throw new BadRequestException('email_required')
    if (type === 'email' && !password) throw new BadRequestException('password_required')
    if (type !== 'email' && !socialToken) throw new BadRequestException('socialToken_required')
    if (type === 'email' && !codeToken) throw new BadRequestException('codeToken_required')

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    try {
      if (codeToken) {
        const { sub: verificationId } = await this.jwtService.verifyToken(options.codeToken, {
          audience: VERIFICATION_AUDIENCE
        })

        const verification = await this.verificationRepository.findOne({
          where: {
            id: verificationId,
            used: false,
            confirmed: true
          }
        })
        if (!verification || verification.type !== 'register') throw new BadRequestException('invalid_code_token')
        if (verification.email && verification.email !== email) throw new BadRequestException('invalid_code_token')
        if (verification.phone && verification.phone !== phone) throw new BadRequestException('invalid_code_token')
        await queryRunner.manager.update(Verification, verificationId, { used: true })
      }

      const user = new User({ email, phone, ...rest })
      await queryRunner.manager.save(user)

      if (type === 'email') {
        const passwordHash = createPasswordHash(password, passwordIterations.user)
        const userPassword = new UserPassword({
          user,
          password: passwordHash.password,
          salt: passwordHash.salt
        })
        const account = new UserAccount({
          user,
          type: type as UserAccountType,
          accountId: email
        })
        await queryRunner.manager.save(userPassword)
        await queryRunner.manager.save(account)
      } else {
        const { sub } = await this.jwtService.verifyToken(socialToken, { audience: SocialService.AUDIENCE })
        const account = new UserAccount({
          user,
          type: type as UserAccountType,
          accountId: sub
        })
        await queryRunner.manager.save(account)
      }
      const setting = new UserSetting({ user, agreeMarketing })
      await queryRunner.manager.save(setting)
      await queryRunner.commitTransaction()
      return this.generateToken(user.id.toString())
    } catch (e) {
      await queryRunner.rollbackTransaction()
      if (e.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('duplicate')
      }
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async validateUserByEmail(email: string, password: string) {
    try {
      const user = await this.userRepository.findOne({
        select: {
          password: { password: true, salt: true }
        },
        where: { accounts: { type: UserAccountType.email, accountId: email } },
        relations: { accounts: true, password: true }
      })

      if (user && verifyPassword(password, user.password.password, user.password.salt, passwordIterations.user)) {
        return this.generateToken(user.id.toString())
      }
      throw new NotFoundException('not_found')
    } catch (e) {
      throw e
    }
  }

  async validateUserBySocial(type: string, token: string) {
    const { sub } = await this.jwtService.verifyToken(token, { audience: SocialService.AUDIENCE })
    const account = await this.userAccountRepository.findOne({
      where: { type: type as UserAccountType, accountId: sub }
    })
    if (account) {
      return this.generateToken(account.userId.toString())
    }
    throw new NotFoundException('not_found')
  }

  async validateSocialToken(type: string, socialToken: string) {
    try {
      const account = await this.socialService.getAccountIdFromToken(type as any, socialToken)
      if (account?.id) {
        const { id, ...user } = account
        const exp = Math.floor(Date.now() / 1000) + SocialService.TOKEN_EXPIRE_TIME
        const token = await this.jwtService.createToken({
          sub: account.id,
          exp,
          aud: SocialService.AUDIENCE
        })
        return { token, user }
      }
    } catch (e) {
      throw new NotFoundException('invalid_token')
    }
    throw new NotFoundException('not_found')
  }

  async verifyDuplicate(email: string): Promise<boolean> {
    try {
      await this.userAccountRepository.findOneOrFail({ where: { type: UserAccountType.email, accountId: email } })
    } catch (e) {
      return true
    }
    throw new ConflictException()
  }

  async changePassword(options: { password: string; newPassword: string; userId: number }) {
    const { password, newPassword, userId } = options
    if (password === newPassword) throw new BadRequestException('same_password')
    const account = await this.userAccountRepository.findOne({
      where: {
        type: UserAccountType.email,
        user: {
          id: userId
        }
      },
      relations: { user: { password: true } }
    })
    if (account && account.user.password) {
      if (
        verifyPassword(password, account.user.password.password, account.user.password.salt, passwordIterations.user)
      ) {
        const passwordHash = createPasswordHash(newPassword, passwordIterations.user)
        await this.userPasswordRepository.update(
          { user: { id: userId } },
          {
            password: passwordHash.password,
            salt: passwordHash.salt
          }
        )
        await this.invalidateAllSessions(userId.toString())
        return this.generateToken(userId.toString())
      } else {
        throw new BadRequestException('wrong_password')
      }
    } else {
      throw new ConflictException('not_found_password')
    }
  }

  async resetPassword(options: { email?: string; phone?: string; password: string; codeToken: string }) {
    const { email, password, phone, codeToken } = options
    const { sub: verificationId } = await this.jwtService.verifyToken(codeToken, { audience: VERIFICATION_AUDIENCE })
    const verification = await this.verificationRepository.findOne({
      where: {
        id: verificationId,
        email,
        phone,
        used: false,
        confirmed: true
      }
    })
    if (!verification || verification.type !== 'resetPassword') throw new BadRequestException('invalid_code_token')
    const queryRunner = this.verificationRepository.manager.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    try {
      verification.used = true
      await this.verificationRepository.save(verification)

      const user = await this.userService.findByEmailOrPhone({ phone, email })
      if (user) {
        const emailAccount = user.accounts.find((a) => a.type === 'email')
        if (emailAccount) {
          const passwordHash = createPasswordHash(password, passwordIterations.user)
          await this.userPasswordRepository.update(
            { user: { id: user.id } },
            {
              password: passwordHash.password,
              salt: passwordHash.salt
            }
          )
          await this.updateUserVersion(user.id)
          await queryRunner.commitTransaction()
          await this.invalidateAllSessions(user.id.toString())
          return
        }
        const accounts = user.accounts.reduce((prev, curr) => {
          if (curr.type !== 'phone' && curr.type !== 'email') prev.push(curr.type)
          return prev
        }, [])
        throw new ConflictException(accounts.join(','))
      }
      throw new NotFoundException('not_found_user')
    } catch (e) {
      await queryRunner.rollbackTransaction()
    } finally {
      await queryRunner.release()
    }
  }

  async logout(userId: number, token: string) {
    await this.jwtService.invalidateRefreshToken(token, userId.toString(), JwtStrategy.AUDIENCE)
  }

  async refreshToken(oldRefreshToken: string) {
    const refreshToken = await this.jwtService.refreshToken(
      oldRefreshToken,
      JwtStrategy.AUDIENCE,
      JwtStrategy.EXPIRE_IN_ACCESS_TOKEN
    )
    const { sub } = this.jwtService.decodeToken(refreshToken)
    const accessTokenInfo = await this.createAccessToken(sub)
    return {
      id: Number(sub),
      accessToken: accessTokenInfo.accessToken,
      expiresIn: accessTokenInfo.expiresIn,
      refreshToken
    }
  }

  private async updateUserVersion(userId: number) {
    await this.userRepository.increment({ id: userId }, 'version', 1)
    const user = await this.userRepository.findOneOrFail({ where: { id: userId }, select: { version: true } })
    await this.jwtService.setVersion(userId.toString(), JwtStrategy.AUDIENCE, user.version)
    return user.version
  }

  private async generateToken(sub: string) {
    const accessTokenInfo = await this.createAccessToken(sub)
    const refreshToken = await this.jwtService.createRefreshToken(
      {
        sub,
        aud: JwtStrategy.AUDIENCE
      },
      JwtStrategy.EXPIRE_IN_REFRESH_TOKEN / 1000
    )
    return {
      id: Number(sub),
      accessToken: accessTokenInfo.accessToken,
      expiresIn: accessTokenInfo.expiresIn,
      refreshToken
    }
  }

  private async createAccessToken(sub: string) {
    const user = await this.userRepository.findOneOrFail({
      where: { id: Number(sub) },
      select: { name: true, version: true }
    })
    await this.jwtService.setVersion(sub, JwtStrategy.AUDIENCE, user.version)
    const exp: number = Math.floor(Date.now() / 1000) + JwtStrategy.EXPIRE_IN_ACCESS_TOKEN
    const accessToken: string = await this.jwtService.createToken(
      {
        sub,
        aud: JwtStrategy.AUDIENCE,
        name: user.name,
        version: user.version
      },
      { expiresIn: JwtStrategy.EXPIRE_IN_ACCESS_TOKEN / 1000 }
    )
    return {
      accessToken: accessToken,
      expiresIn: exp
    }
  }

  private invalidateAllSessions(sub: string) {
    return this.jwtService.invalidateAllSessions(sub, JwtStrategy.AUDIENCE)
  }
}

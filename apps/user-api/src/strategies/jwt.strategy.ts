import { User } from '@data/domain'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { InjectRepository } from '@nestjs/typeorm'
import { JwtService } from '@system/jwt'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Repository } from 'typeorm'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  static readonly AUDIENCE = 'user'
  static readonly EXPIRE_IN_ACCESS_TOKEN = 60 * 60 * 1000 * 2 // 2시간
  static readonly EXPIRE_IN_REFRESH_TOKEN = 24 * 60 * 60 * 1000 * 14 // 14일
  static readonly ACCESS_COOKIE_NAME = 'user-access-token'
  static readonly REFRESH_COOKIE_NAME = 'user-refresh-token'

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {
    const publicKey = configService.get('jwt.publicKey')
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          let token = ExtractJwt.fromAuthHeaderAsBearerToken()(request)
          if (!token && request && request.cookies) {
            token = request.cookies[JwtStrategy.ACCESS_COOKIE_NAME]
          }
          if (!token) throw new UnauthorizedException('invalid_access_token')
          return token
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      audience: JwtStrategy.AUDIENCE
    })
  }

  async validate(payload: any) {
    if (payload.sub && payload.aud) {
      const reqVersion = payload.version ?? 0
      const version = await this.getVersion(payload.sub, payload.aud, reqVersion)
      if (version !== reqVersion) {
        throw new UnauthorizedException('invalid_access_token')
      }
      return { id: payload.sub, role: payload.aud, name: payload.name }
    }
    return null
  }

  private async getVersion(sub: string, aud: string, reqVersion: number) {
    let version = (await this.jwtService.getVersion(sub, aud)) ?? 0
    if (version === reqVersion) {
      return version
    }
    if (reqVersion > version) {
      version = reqVersion
    }
    if (aud === JwtStrategy.AUDIENCE) {
      const user = await this.userRepository.findOne({ where: { id: Number(sub) } })
      if (user) {
        await this.jwtService.setVersion(sub, aud, version)
        return version
      }
    }
    return null
  }
}

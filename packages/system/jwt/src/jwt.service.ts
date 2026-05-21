import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService as NestJwtService, type JwtVerifyOptions } from '@nestjs/jwt'
import Redis from 'ioredis'
import { type SignOptions } from 'jsonwebtoken'
import { type JwtModuleOptions } from './jwt.options'

@Injectable()
export class JwtService {
  private readonly redis: Redis
  private readonly logger = new Logger('Jwt')

  constructor(
    @Inject('JWT_CONFIG_OPTIONS') private readonly config: JwtModuleOptions,
    private readonly jwtService: NestJwtService
  ) {
    this.redis = new Redis(config.redis)
  }

  async createToken(payload: Record<string, any>, options?: SignOptions) {
    return this.jwtService.signAsync(payload, options)
  }

  async verifyToken(token: string, options?: JwtVerifyOptions) {
    try {
      return await this.jwtService.verifyAsync(token, options)
    } catch (e) {
      throw new UnauthorizedException('invalid_token')
    }
  }

  decodeToken(token: string) {
    return this.jwtService.decode(token)
  }

  async refreshToken(
    oldRefreshToken: string,
    aud: string,
    expireMilliseconds: number,
    options?: SignOptions
  ): Promise<string> {
    const cacheKey = `refreshProcessing:${oldRefreshToken}`
    const lockKey = `${cacheKey}:lock`

    const cachedResult = await this.redis.get(cacheKey)
    if (cachedResult) {
      if (cachedResult === 'error') {
        throw new UnauthorizedException('invalid_token')
      }
      this.logger.debug(`CachedResult for ${oldRefreshToken}.`)
      return cachedResult
    }
    try {
      const lock = await this.acquireLock(lockKey)
      if (!lock) {
        return this.waitForCache(cacheKey)
      }
      const { iat, exp, ...payload } = await this.validateRefreshToken(oldRefreshToken, aud)
      await this.invalidateRefreshToken(oldRefreshToken, payload.sub, aud)
      const refreshToken = await this.createRefreshToken(payload, expireMilliseconds, options)
      await this.redis.setex(cacheKey, 5, refreshToken)
      return refreshToken
    } catch (error) {
      await this.redis.setex(cacheKey, 5, 'error')
      this.logger.debug(`Error refreshing token for ${oldRefreshToken}: ${error.message}`, error.stack)
      throw error
    } finally {
      await this.redis.unlink(lockKey)
    }
  }

  async createRefreshToken(payload: Record<string, any>, expireMilliseconds: number, options: SignOptions = {}) {
    const refreshToken = await this.createToken(payload, { ...options, expiresIn: expireMilliseconds })
    await this.storeRefreshToken(refreshToken, payload.sub, payload.aud, expireMilliseconds)
    return refreshToken
  }

  async invalidateRefreshToken(token: string, sub: string, aud: string): Promise<void> {
    if (!sub || !aud) return
    await this.redis.unlink(this.getRefreshTokenKey(token))
    await this.redis.lrem(this.getUserRefreshTokenKey(aud, sub), 0, token)
  }

  async invalidateAllSessions(sub: string, aud: string) {
    if (!sub || !aud) return
    const tokens = await this.redis.lrange(this.getUserRefreshTokenKey(aud, sub), 0, -1)

    for (const token of tokens) {
      await this.redis.unlink(this.getRefreshTokenKey(token))
    }
    await this.redis.unlink(this.getUserRefreshTokenKey(aud, sub))
    await this.redis.unlink(this.getVersionKey(aud, sub))
  }

  async setVersion(sub: string, aud: string, version: number): Promise<void> {
    await this.redis.set(this.getVersionKey(aud, sub), version.toString())
  }

  async getVersion(sub: string, aud: string): Promise<number | null> {
    const version = await this.redis.get(this.getVersionKey(aud, sub))
    return version ? parseInt(version, 10) : null
  }

  async deleteVersion(sub: string, aud: string): Promise<void> {
    await this.redis.unlink(this.getVersionKey(aud, sub))
  }

  private async validateRefreshToken(oldRefreshToken: string, aud: string) {
    try {
      const payload = await this.verifyToken(oldRefreshToken, { audience: aud })
      const tokenExists = await this.redis.sismember(this.getUserRefreshTokenKey(aud, payload.sub), oldRefreshToken)
      if (!tokenExists) {
        throw new Error('Not found refresh token')
      }
      return payload
    } catch (e) {
      this.logger.debug(e.message)
      throw new UnauthorizedException('invalid_refresh_token')
    }
  }

  private async storeRefreshToken(token: string, sub: string, aud: string, expireMilliseconds: number) {
    if (!sub || !aud) return
    const tokenMeta = JSON.stringify({
      token,
      userId: sub,
      role: aud,
      createdAt: new Date().toISOString()
    })
    await this.redis.set(this.getRefreshTokenKey(token), tokenMeta, 'PX', expireMilliseconds)

    const listKey = this.getUserRefreshTokenKey(aud, sub)
    await this.redis.lpush(listKey, token)
    await this.redis.ltrim(listKey, 0, 9)
  }

  private async acquireLock(key: string, seconds = 5) {
    const lock = await this.redis.set(key, 'true', 'EX', seconds, 'NX')
    return !!lock
  }

  private async waitForCache(
    cacheKey: string,
    timeoutMilliseconds = 5000,
    intervalMilliseconds = 1000
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        clearInterval(intervalId)
        reject(new Error('Timeout waiting for token refresh'))
      }, timeoutMilliseconds)

      const intervalId = setInterval(async () => {
        const cachedResult = await this.redis.get(cacheKey)
        if (cachedResult) {
          clearTimeout(timeoutId)
          clearInterval(intervalId)
          if (cachedResult === 'error') {
            reject(new UnauthorizedException('invalid_token'))
          } else {
            resolve(cachedResult)
          }
        }
      }, intervalMilliseconds)
    })
  }

  private getVersionKey(aud: string, sub: string) {
    return `${aud}:${sub}:version`
  }

  private getUserRefreshTokenKey(aud: string, sub: string) {
    return `userRefreshTokens:${aud}:${sub}`
  }

  private getAccessTokenKey(token: string) {
    return `accessToken:${token}`
  }

  private getRefreshTokenKey(token: string) {
    return `refreshToken:${token}`
  }
}

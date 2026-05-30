import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { Apple, Facebook, Google, Kakao, Naver } from './lib'
import { type SocialOptions } from './social.module'
import { FastifyInstance } from 'fastify'
import fastifyOauth2 from '@fastify/oauth2'
import { HttpAdapterHost } from '@nestjs/core'
import { onCloud } from '@data/lib'
import { JwtService } from '@system/jwt'

type Provider = 'apple' | 'facebook' | 'google' | 'kakao' | 'naver'
@Injectable()
export class SocialService implements OnApplicationBootstrap {
  static readonly AUDIENCE = 'oauth2'
  static readonly TOKEN_EXPIRE_TIME = 10 * 60
  readonly COOKIE_EXPIRE_TIME = 10 * 60
  readonly REDIRECT_URI_PARAM_COOKIE_NAME = 'redirect-uri'
  private readonly logger = new Logger('SocialService')

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject('SOCIAL_CONFIG_OPTIONS') private readonly options: SocialOptions,
    private readonly jwtService: JwtService
  ) {}

  async onApplicationBootstrap() {
    const fastify = this.httpAdapterHost.httpAdapter.getInstance<FastifyInstance>()
    const { kakao, facebook, google, naver, apple, oauth2Path = '/auth/oauth2', callbackUri } = this.options
    const oauth2Options = {
      kakao: Kakao.getOauth2Options({ ...kakao, callbackUri }),
      facebook: Facebook.getOauth2Options({ ...facebook, callbackUri }),
      google: Google.getOauth2Options({ ...google, callbackUri }),
      naver: Naver.getOauth2Options({ ...naver, callbackUri }),
      apple: Apple.getOauth2Options({ ...apple, callbackUri })
    }
    Object.entries(oauth2Options).forEach(([key, value]) => {
      if (value) {
        fastify.register(fastifyOauth2, { ...value, cookie: { path: oauth2Path, secure: onCloud } })
      }
    })

    fastify.get<{
      Params: {
        provider: Provider
      }
      Querystring: {
        redirectUri: string
      }
    }>(`${oauth2Path}/authorization/:provider`, async (req, reply) => {
      const provider = req.params.provider
      const oauth2Option = oauth2Options[provider]
      if (!oauth2Option) {
        throw new Error('Invalid provider')
      }
      const redirectUri = req.query.redirectUri
      if (!redirectUri) {
        throw new Error('Redirect URI is required')
      }
      reply.setCookie(this.REDIRECT_URI_PARAM_COOKIE_NAME, redirectUri, {
        path: oauth2Path,
        httpOnly: true,
        secure: onCloud,
        maxAge: this.COOKIE_EXPIRE_TIME
      })
      fastify[oauth2Option.name].generateAuthorizationUri(req, reply, (err, authorizationEndpoint) => {
        if (err) this.logger.error(err)
        reply.redirect(authorizationEndpoint)
      })
    })

    fastify.get<{
      Params: {
        provider: Provider
      }
    }>(`${oauth2Path}/code/:provider`, async (req, reply) => {
      const provider = req.params.provider
      const oauth2Option = oauth2Options[provider]
      if (!oauth2Option) {
        throw new Error('Invalid provider')
      }
      const redirectUri = req.cookies[this.REDIRECT_URI_PARAM_COOKIE_NAME]
      if (!redirectUri) {
        throw new Error('Redirect URI is required')
      }
      const { token } = await fastify[oauth2Option.name].getAccessTokenFromAuthorizationCodeFlow(req)
      const providerToken = provider === 'google' ? token.id_token || token.access_token : token.access_token
      const account = await this.getAccountIdFromToken(provider, providerToken)
      if (!account?.id) {
        throw new Error('Invalid social account')
      }

      const resUser = {
        email: account.email,
        name: account.name,
        profileImage: account.profileImage
      }
      const exp = Math.floor(Date.now() / 1000) + SocialService.TOKEN_EXPIRE_TIME
      const resToken = await this.jwtService.createToken({
        sub: account.id.toString(),
        exp,
        aud: SocialService.AUDIENCE
      })
      const search = new URLSearchParams()
      search.append('token', resToken)
      search.append('type', provider)
      search.append('user', JSON.stringify(resUser))
      reply.redirect(`${redirectUri}?${search.toString()}`, 302)
    })
  }

  async getAccountIdFromToken(
    type: Provider,
    token: string
  ): Promise<
    { id: string; name?: string; email?: string; profileImage?: string } | undefined
  > {
    if (!this.options[type]) {
      return
    }
    try {
      switch (type) {
        case 'apple': {
          return await Apple.getMe(token, [this.options.apple.clientId])
        }
        case 'facebook': {
          return await Facebook.getMe({ access_token: token })
        }
        case 'google': {
          return await Google.getMe(token, this.options.google.clientId)
        }
        case 'kakao': {
          return await Kakao.getMe(token)
        }
        case 'naver': {
          return await Naver.getMe(token)
        }
        default:
          break
      }
    } catch (e) {
      throw e
    }
  }
}

import { onCloud } from '@data/lib'
import { Inject, Injectable } from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'
import { type CookieModuleOptions } from './cookie.options'
import type { CookieSerializeOptions } from '@fastify/cookie'

@Injectable()
export class CookieService {
  constructor(@Inject('CONFIG_OPTIONS') private readonly config: CookieModuleOptions) {}

  getCookieValue(req: FastifyRequest, name: string) {
    return req.cookies[name]
  }

  setCookie(
    res: FastifyReply,
    name: string,
    value: string,
    maxAge: number,
    path = '/',
    domain = this.config.cookieDomain
  ) {
    res.setCookie(name, value, {
      secure: onCloud,
      path,
      domain,
      sameSite: 'strict',
      httpOnly: true,
      maxAge: maxAge
    })
  }

  deleteCookies(res: FastifyReply, cookies: string[], path = '/', domain = this.config.cookieDomain) {
    const cookieOptions: CookieSerializeOptions = {
      secure: onCloud,
      path,
      domain,
      sameSite: 'strict',
      httpOnly: true
    }
    cookies.forEach((cookie) => {
      res.clearCookie(cookie, cookieOptions)
      res.clearCookie(cookie, cookieOptions)
    })
  }
}

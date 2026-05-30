import axios from 'axios'
import { InternalServerErrorException } from '@nestjs/common'
import { HttpException } from '@nestjs/common/exceptions/http.exception'
import type { FastifyOAuth2Options } from '@fastify/oauth2'

type NaverAccountResponse = {
  id?: string
  name?: string
  email?: string
  profile_image?: string
}

type NaverAccount = {
  id: string
  name?: string
  email?: string
  profileImage?: string
}

function getOauth2Options(options?: {
  clientId: string
  clientSecret: string
  callbackUri: string
  scope?: string[]
  service_terms?: string[]
}): FastifyOAuth2Options | null {
  if (!options) return null
  const { clientId, clientSecret, callbackUri, scope = ['email', 'name', 'profile_image'] } = options
  const callbackUriParams: Record<string, string> = {}

  return {
    name: 'naverOauth2',
    scope,
    credentials: {
      client: {
        id: clientId,
        secret: clientSecret
      },
      auth: {
        authorizePath: '/oauth2.0/authorize',
        tokenHost: 'https://nid.naver.com',
        tokenPath: '/oauth2.0/token'
      }
    },
    callbackUri: `${callbackUri}/naver`,
    tokenRequestParams: {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code'
    },
    callbackUriParams
  }
}

function urlRequest(options) {
  return axios({
    method: options.method || 'get',
    url: options.url,
    headers: options.headers || {},
    params: options.params || {},
    data: options.data || {},
    timeout: 10000
  })
}

function errorHandler(error: any) {
  if (error.response.status) {
    return new HttpException({ message: error.response.data?.message }, error.response.status)
  }
  return new InternalServerErrorException(error.response.data)
}

async function getMe(accessToken: string): Promise<NaverAccount | undefined> {
  try {
    const { data } = await urlRequest({
      url: 'https://openapi.naver.com/v1/nid/me',
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const account = data.response as NaverAccountResponse | undefined
    if (!account?.id) return

    return {
      id: account.id,
      name: account.name ?? undefined,
      email: account.email ?? undefined,
      profileImage: account.profile_image ?? undefined
    }
  } catch (e) {
    throw errorHandler(e)
  }
}

export { getOauth2Options, getMe }

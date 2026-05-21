import axios from 'axios'
import { InternalServerErrorException } from '@nestjs/common'
import { HttpException } from '@nestjs/common/exceptions/http.exception'
import type { FastifyOAuth2Options } from '@fastify/oauth2'

function getOauth2Options(options?: {
  clientId: string
  clientSecret: string
  callbackUri: string
  scope?: string[]
  service_terms?: string[]
}): FastifyOAuth2Options | null {
  if (!options) return null
  const { clientId, clientSecret, callbackUri, scope = ['email', 'name'] } = options
  const callbackUriParams: Record<string, string> = {}

  return {
    name: 'naverOauth2',
    scope,
    credentials: {
      client: {
        id: 'KuaL1Vz26AIFeuDxfOLF',
        secret: 'VwwbURUNOB'
      },
      auth: {
        authorizePath: '/oauth2.0/authorize',
        tokenHost: 'https://nid.naver.com',
        tokenPath: '/oauth2.0/token'
      }
    },
    callbackUri: `${callbackUri}/naver`,
    tokenRequestParams: {
      client_id: 'KuaL1Vz26AIFeuDxfOLF',
      client_secret: 'VwwbURUNOB',
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

async function getMe(accessToken: string): Promise<any> {
  try {
    const { data } = await urlRequest({
      url: 'https://openapi.naver.com/v1/nid/me',
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    return data.response
  } catch (e) {
    throw errorHandler(e)
  }
}

export { getOauth2Options, getMe }

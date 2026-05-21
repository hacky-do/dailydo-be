import axios from 'axios'
import type { FastifyOAuth2Options } from '@fastify/oauth2'

function getOauth2Options(options?: {
  clientId: string
  clientSecret: string
  callbackUri: string
  scope?: string[]
  service_terms?: string[]
}): FastifyOAuth2Options | null {
  if (!options) return null
  const { clientId, clientSecret, callbackUri, scope = ['account_email', 'name'] } = options
  const callbackUriParams: Record<string, string> = {}
  if (options.service_terms) {
    callbackUriParams.service_terms = options.service_terms.join(',')
  }
  return {
    name: 'kakaoOauth2',
    scope,
    credentials: {
      client: {
        id: clientId,
        secret: clientSecret
      },
      auth: {
        tokenHost: 'https://kauth.kakao.com'
      }
    },
    callbackUri: `${callbackUri}/kakao`,
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

function errorHandler(error) {
  if (error.response.status)
    return {
      status: error.response.status,
      message: error.response.statusText
    }
  return { status: 500, message: error.response.data }
}

async function getMe(accessToken: string) {
  try {
    const { data } = await urlRequest({
      url: 'https://kapi.kakao.com/v2/user/me',
      method: 'post',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    return {
      id: data.id,
      profileImage: data.kakao_account.profile.profile_image_url,
      name: data.kakao_account.name,
      email: data.kakao_account.email
    }
  } catch (error) {
    throw errorHandler(error)
  }
}

export { getOauth2Options, getMe }

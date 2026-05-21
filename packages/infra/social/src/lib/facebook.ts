import axios from 'axios'
import { type FastifyOAuth2Options } from '@fastify/oauth2'
import oauthPlugin from '@fastify/oauth2'

const baseUrl = 'https://graph.facebook.com'

function getOauth2Options(options: {
  clientId?: string
  clientSecret?: string
  callbackUri: string
  scope?: string[]
}): FastifyOAuth2Options {
  const { clientId, clientSecret, callbackUri, scope = ['email', 'public_profile'] } = options
  return {
    name: 'facebookOauth2',
    scope,
    credentials: {
      client: {
        id: clientId,
        secret: clientSecret
      },
      auth: oauthPlugin.FACEBOOK_CONFIGURATION
    },
    callbackUri: `${callbackUri}/facebook`
  }
}

function urlRequest(options) {
  return axios({
    method: options.method || 'get',
    url: baseUrl + options.path,
    params: options.params || {},
    data: options.data || {},
    timeout: 10000
  })
}

async function getMe(options: { fields?: string[]; access_token: string }): Promise<{
  id: string
  email?: string
  name?: string
}> {
  try {
    const { data } = await urlRequest({
      path: '/me',
      params: {
        fields: options.fields ? options.fields.join(',') : 'id, email, first_name, last_name',
        access_token: options.access_token
      }
    })
    return {
      id: data.id,
      email: data.email,
      name: `${data.last_name} ${data.first_name}`
    }
  } catch (e) {
    throw new Error(e)
  }
}

export { getOauth2Options, getMe }

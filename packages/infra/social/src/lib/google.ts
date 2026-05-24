import { OAuth2Client } from 'google-auth-library'
import { type FastifyOAuth2Options } from '@fastify/oauth2'
import oauthPlugin from '@fastify/oauth2'

function getOauth2Options(options: {
  clientId?: string
  clientSecret?: string
  callbackUri: string
  scope?: string[]
}): FastifyOAuth2Options {
  const { clientId, clientSecret, callbackUri, scope = ['email', 'profile'] } = options
  return {
    name: 'googleOauth2',
    scope,
    credentials: {
      client: {
        id: clientId,
        secret: clientSecret
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION
    },
    callbackUri: `${callbackUri}/google`
  }
}

async function getMe(code: string, clientId: string) {
  try {
    const client = new OAuth2Client(clientId)
    const ticket = await client.verifyIdToken({
      idToken: code,
      audience: clientId
    })
    const payload = ticket.getPayload()
    const id = payload['sub']
    return {
      id,
      name: payload.name,
      email: payload.email
    }
  } catch (e) {
    throw new Error(e)
  }
}

export { getMe, getOauth2Options }

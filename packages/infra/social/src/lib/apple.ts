import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import oauthPlugin from '@fastify/oauth2'
import type { FastifyOAuth2Options } from '@fastify/oauth2'

function getOauth2Options(options: {
  clientId?: string
  clientSecret?: string
  callbackUri: string
  scope?: string[]
}): FastifyOAuth2Options {
  const { clientId, clientSecret, callbackUri, scope = ['email', 'name'] } = options
  return {
    name: 'appleOauth2',
    scope,
    credentials: {
      client: {
        id: clientId,
        secret: clientSecret
      },
      auth: oauthPlugin.APPLE_CONFIGURATION
    },
    callbackUri: `${callbackUri}/apple`
  }
}

const baseUrl = 'https://appleid.apple.com'

const appleJwksClient = jwksClient({
  jwksUri: `${baseUrl}/auth/keys`
})

async function getMe(idToken: string, clientId: string[]) {
  const decodedToken = jwt.decode(idToken, { complete: true }) as {
    header: { kid: string; alg: jwt.Algorithm }
    payload: { sub: string }
  }
  const keyIdFromToken = decodedToken.header.kid
  const key = await appleJwksClient.getSigningKey(keyIdFromToken)
  const publicKey = key.getPublicKey()

  const jwtClaims: any = jwt.verify(idToken, publicKey, { algorithms: [decodedToken.header.alg] })
  if (jwtClaims.iss !== baseUrl) throw new Error(`id token not issued by correct OpenID provider${jwtClaims.iss}`)
  if (!clientId || clientId.indexOf(jwtClaims.aud) < 0) throw new Error('aud parameter does not include this client')
  const id = jwtClaims['sub']
  return {
    id,
    kid: keyIdFromToken,
    email: jwtClaims.email
  }
}

export { getOauth2Options, getMe }

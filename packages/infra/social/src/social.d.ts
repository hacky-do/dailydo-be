import { OAuth2Namespace } from '@fastify/oauth2'

declare module 'fastify' {
  interface FastifyInstance {
    googleOauth2: OAuth2Namespace
  }
}

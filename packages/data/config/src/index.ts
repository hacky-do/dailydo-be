import { merge } from 'es-toolkit'
import { set } from 'es-toolkit/compat'

import defaultConfig from './default'
import e2e from './e2e'
import test from './test'

const envConfigs = {
  e2e,
  test
}

function splitCsv(value?: string) {
  if (!value) return undefined
  const values = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return values.length > 0 ? values : undefined
}

function toNumber(value?: string) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

function toBoolean(value?: string) {
  if (!value) return undefined
  if (['true', '1', 'yes', 'y', 'on'].includes(value.toLowerCase())) return true
  if (['false', '0', 'no', 'n', 'off'].includes(value.toLowerCase())) return false
  return undefined
}

function setIfDefined(envs: Record<string, any>, path: string, value: unknown) {
  if (value === undefined || value === null || value === '') return
  set(envs, path, value)
}

function toRecord(entries: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(entries).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

function normalizePem(value?: string) {
  if (!value) return value
  return value.replace(/\\n/g, '\n').trim()
}

function setSocialProvider(envs: Record<string, any>, path: string, provider: Record<string, unknown>) {
  const normalizedProvider = toRecord(provider)
  if (!normalizedProvider.clientId || !normalizedProvider.clientSecret) {
    return
  }
  set(envs, path, normalizedProvider)
}

function applyEnvOverrides(envs: Record<string, any>) {
  setIfDefined(envs, 'host.api', process.env.HOST_API)
  setIfDefined(envs, 'host.web', process.env.HOST_WEB)
  setIfDefined(envs, 'cookieDomain', process.env.COOKIE_DOMAIN)
  setIfDefined(envs, 'apiDocs.auth.id', process.env.API_DOCS_AUTH_ID)
  setIfDefined(envs, 'apiDocs.auth.password', process.env.API_DOCS_AUTH_PASSWORD)
  setIfDefined(envs, 'cors.origin', splitCsv(process.env.CORS_ORIGIN))
  setIfDefined(envs, 'cors.credentials', toBoolean(process.env.CORS_CREDENTIALS))
  setIfDefined(envs, 'cors.allowedHeaders', splitCsv(process.env.CORS_ALLOWED_HEADERS))
  setIfDefined(envs, 'cors.methods', splitCsv(process.env.CORS_METHODS))
  setIfDefined(envs, 'cors.exposedHeaders', splitCsv(process.env.CORS_EXPOSED_HEADERS))

  setIfDefined(envs, 'aws.region', process.env.AWS_REGION)
  setIfDefined(envs, 'aws.bucket', process.env.AWS_BUCKET)
  setIfDefined(envs, 'aws.uploadPrefix', process.env.AWS_UPLOAD_PREFIX)
  setIfDefined(envs, 'aws.bucketPath', process.env.AWS_BUCKET_PATH)
  setIfDefined(envs, 'aws.cloudfront', process.env.AWS_CLOUDFRONT)
  setIfDefined(envs, 'aws.accessKeyId', process.env.AWS_ACCESS_KEY_ID)
  setIfDefined(envs, 'aws.secretAccessKey', process.env.AWS_SECRET_ACCESS_KEY)
  setIfDefined(envs, 'aws.opensearch.node', splitCsv(process.env.AWS_OPENSEARCH_NODE))

  setIfDefined(envs, 'redis.host', process.env.REDIS_HOST)
  setIfDefined(envs, 'redis.port', toNumber(process.env.REDIS_PORT))

  setIfDefined(envs, 'database.type', process.env.DB_TYPE)
  setIfDefined(envs, 'database.host', process.env.DB_HOST)
  setIfDefined(envs, 'database.port', toNumber(process.env.DB_PORT))
  setIfDefined(envs, 'database.username', process.env.DB_USERNAME)
  setIfDefined(envs, 'database.password', process.env.DB_PASSWORD)
  setIfDefined(envs, 'database.database', process.env.DB_NAME)
  setIfDefined(envs, 'database.timezone', process.env.DB_TIMEZONE)
  setIfDefined(envs, 'database.charset', process.env.DB_CHARSET)
  setIfDefined(envs, 'database.synchronize', toBoolean(process.env.DB_SYNCHRONIZE))
  setIfDefined(envs, 'database.logging', toBoolean(process.env.DB_LOGGING))
  if (toBoolean(process.env.DB_SSL)) {
    set(envs, 'database.ssl', { rejectUnauthorized: false })
  }

  setIfDefined(envs, 'jwt.publicKey', normalizePem(process.env.JWT_PUBLIC_KEY))
  setIfDefined(envs, 'jwt.privateKey', normalizePem(process.env.JWT_PRIVATE_KEY))

  setSocialProvider(envs, 'social.google', {
    clientId: process.env.SOCIAL_GOOGLE_CLIENT_ID,
    clientSecret: process.env.SOCIAL_GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.SOCIAL_GOOGLE_REDIRECT_URI
  })
  setSocialProvider(envs, 'social.github', {
    clientId: process.env.SOCIAL_GITHUB_CLIENT_ID,
    clientSecret: process.env.SOCIAL_GITHUB_CLIENT_SECRET,
    redirectUri: process.env.SOCIAL_GITHUB_REDIRECT_URI
  })
  setSocialProvider(envs, 'social.apple', {
    clientId: process.env.SOCIAL_APPLE_CLIENT_ID,
    clientSecret: process.env.SOCIAL_APPLE_CLIENT_SECRET,
    redirectUri: process.env.SOCIAL_APPLE_REDIRECT_URI
  })
  setSocialProvider(envs, 'social.kakao', {
    clientId: process.env.SOCIAL_KAKAO_CLIENT_ID,
    clientSecret: process.env.SOCIAL_KAKAO_CLIENT_SECRET,
    redirectUri: process.env.SOCIAL_KAKAO_REDIRECT_URI
  })
  setSocialProvider(envs, 'social.facebook', {
    clientId: process.env.SOCIAL_FACEBOOK_CLIENT_ID,
    clientSecret: process.env.SOCIAL_FACEBOOK_CLIENT_SECRET,
    redirectUri: process.env.SOCIAL_FACEBOOK_REDIRECT_URI
  })
  setSocialProvider(envs, 'social.naver', {
    clientId: process.env.SOCIAL_NAVER_CLIENT_ID,
    clientSecret: process.env.SOCIAL_NAVER_CLIENT_SECRET,
    redirectUri: process.env.SOCIAL_NAVER_REDIRECT_URI
  })
}

export default () => {
  const envs: Record<string, any> = {}
  merge(envs, defaultConfig)

  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv && nodeEnv in envConfigs) {
    merge(envs, envConfigs[nodeEnv as keyof typeof envConfigs])
  }

  applyEnvOverrides(envs)
  return envs
}

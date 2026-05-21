import { onCloud } from '@data/lib'
import { ConfigService } from '@nestjs/config'
import { NestFastifyApplication } from '@nestjs/platform-fastify'
import { SwaggerCustomOptions } from '@nestjs/swagger'
import { OpenapiModule } from '@system/openapi'
import { UserHttpModule } from '../controllers/user-http.module'

export function setupSwagger(
  app: NestFastifyApplication,
  spec: {
    pkgName: string
    version: string
    redocPath: string
  },
  swaggerCustomOptions: SwaggerCustomOptions = {}
) {
  const { pkgName, version, redocPath } = spec
  const doc = OpenapiModule.createDocument(
    app,
    {
      title: `${pkgName} user API`,
      name: 'user',
      version,
      redocPath,
      builderConfig: (builder) => {
        builder.addCookieAuth()
        builder.addBearerAuth()
      }
    },
    {
      include: [UserHttpModule],
      deepScanRoutes: true,
      ignoreGlobalPrefix: true,
      operationIdFactory: (controllerKey: string, methodKey: string) => {
        const controller = controllerKey.replace(/Controller$/, '')
        return `${controller}_${methodKey}`
      }
    }
  )

  OpenapiModule.setupSwagger(app, __dirname, `${redocPath}/swagger`, doc, swaggerCustomOptions)
  return `${redocPath}/swagger`
}

export async function initializeApiDocs(app: NestFastifyApplication) {
  const { default: pkg } = await import('../../package.json', { with: { type: 'json' } })
  const documentPath = '/api-docs'

  const { auth, urls } = app.get(ConfigService).get('apiDocs')
  OpenapiModule.setupRedoc(app, documentPath, urls)

  const swaggerDocumentPath = setupSwagger(
    app,
    { pkgName: pkg.name, version: pkg.version, redocPath: documentPath },
    {
      explorer: true,
      swaggerOptions: {
        filter: true,
        urls,
        'urls.primaryName': 'user'
      }
    }
  )

  if (onCloud) {
    function validate(username, password, req, reply, done) {
      if (username === auth.id && password === auth.password) {
        done()
      } else {
        done(new Error('unauthorized'))
      }
    }

    await app.register(require('@fastify/basic-auth'), {
      validate,
      authenticate: { realm: `${pkg.name} ${process.env.NODE_ENV}` }
    })
    app
      .getHttpAdapter()
      .getInstance()
      .addHook('onRequest', (req, reply, done) => {
        if (req.url.startsWith(documentPath) || req.url.startsWith(swaggerDocumentPath)) {
          app.getHttpAdapter().getInstance()['basicAuth'](req, reply, done)
        } else {
          done()
        }
      })
  }
}

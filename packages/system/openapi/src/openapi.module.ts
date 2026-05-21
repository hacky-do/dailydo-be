import { INestApplication } from '@nestjs/common'
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
  SwaggerModule
} from '@nestjs/swagger'
import ejs from 'ejs'
import { FastifyRequest, FastifyReply } from 'fastify'
import fs from 'node:fs'
import path from 'path'
import YAML from 'yaml'

export class OpenapiModule {
  static setupRedoc(app: INestApplication, redocPath: string, urls: { name: string; url: string }[]) {
    const route = app.getHttpAdapter().getInstance()

    route.get(redocPath, async (req: FastifyRequest, res: FastifyReply) => {
      const html = await ejs.renderFile(path.join(__dirname, 'redoc.ejs'), { urls })
      res.type('text/html').send(html)
    })
  }
  static setupSwagger(
    app: INestApplication,
    dirname: string,
    swaggerPath: string,
    swaggerDocument: OpenAPIObject | (() => OpenAPIObject),
    swaggerCustomOptions: SwaggerCustomOptions = {}
  ) {
    SwaggerModule.setup(swaggerPath, app, swaggerDocument, {
      patchDocumentOnRequest: (req: any, res: any, document) => {
        if (req.query.redoc) {
          return OpenapiModule.updateRedocDocument(dirname, document)
        }
        return document
      },
      ...swaggerCustomOptions
    })
  }

  static createDocument(
    app: INestApplication,
    options: {
      title: string
      name?: string
      version: string
      redocPath: string
      hidePrimaryName?: boolean
      builderConfig?: (builder: DocumentBuilder) => void
    },
    swaggerDocumentOptions?: SwaggerDocumentOptions
  ) {
    const { title, name, redocPath, version, builderConfig, hidePrimaryName } = options
    let description = `- [${name} API 문서](${redocPath}`
    if (hidePrimaryName) {
      description += ')'
    } else {
      description += `?urls.primaryName=${name})`
    }
    const builder = new DocumentBuilder().setTitle(title).setDescription(description).setVersion(version)

    if (builderConfig) {
      builderConfig(builder)
    }
    const config = builder.build()
    return SwaggerModule.createDocument(app, config, swaggerDocumentOptions)
  }

  private static updateRedocDocument(dirname: string, doc: OpenAPIObject) {
    const ret = structuredClone(doc)
    const file = fs.readFileSync(path.join(dirname, 'doc', `doc.yml`), 'utf8')
    const markdown = YAML.parse(file)
    if (markdown.info?.description) {
      ret.info.description = markdown.info.description
        .map((d: string) => fs.readFileSync(path.join(dirname, 'doc', 'info', `${d}.md`), 'utf8'))
        .join('\n')
    }

    const pathTags = new Set<string>()
    Object.values(ret.paths).forEach((pathItem) => {
      Object.values(pathItem).forEach((operation) => {
        const operationFilePath = path.join(dirname, 'doc', 'operations', `${operation.operationId}.md`)
        if (fs.existsSync(operationFilePath)) {
          operation.description = fs.readFileSync(operationFilePath, 'utf8')
        }
        if (operation.tags) {
          operation.tags.forEach((tag) => pathTags.add(tag))
        }
      })
    })

    pathTags.forEach((tag) => {
      const tagFilePath = path.join(dirname, 'doc', 'tags', `${tag}.md`)
      if (fs.existsSync(tagFilePath)) {
        const tagDescription = fs.readFileSync(tagFilePath, 'utf8')
        ret.tags.push({ name: tag, description: tagDescription })
      }
    })

    if (markdown.tagGroups?.length > 0) {
      const customTagGroups = markdown.tagGroups
      const groupedTags = new Set<string>()
      customTagGroups.forEach((group) => group.tags.forEach((tag) => groupedTags.add(tag)))

      const ungroupedTags = Array.from(pathTags).filter((tag) => !groupedTags.has(tag))

      const ungroupedTagGroup = {
        name: 'Ungrouped',
        tags: ungroupedTags
      }
      ret['x-tagGroups'] = [...customTagGroups]
      if (ungroupedTags.length) {
        ret['x-tagGroups'].unshift(ungroupedTagGroup)
      }
    }
    return ret
  }
}

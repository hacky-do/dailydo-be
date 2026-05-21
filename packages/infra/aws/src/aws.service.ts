import { S3Client } from '@aws-sdk/client-s3'
// import { SESClient } from '@aws-sdk/client-ses'
import { Inject, Injectable } from '@nestjs/common'
import { type AwsModuleOptions } from './aws.options'
import * as lib from './lib'

@Injectable()
export class AwsService {
  private readonly s3Client: S3Client
  // private readonly sesClient: SESClient
  // private readonly logger = new Logger('aws')

  constructor(@Inject('CONFIG_OPTIONS') private config: AwsModuleOptions) {
    const credentials =
      config.accessKeyId && config.secretAccessKey
        ? { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey }
        : undefined
    this.s3Client = new S3Client({ region: config.region, credentials })
    // this.sesClient = new SESClient({ region: config.region, credentials })
  }

  async generatePreSignedUrl(options: {
    contentType: string
    key: string
    fileName?: string
  }): Promise<{ path: string; url: string; fields: Record<string, string> }> {
    return lib.generatePreSignedUrl(this.s3Client, {
      bucket: this.config.bucket,
      key: `${this.config.uploadPrefix}/${options.key}`,
      maxFileSize: 1024 * 1024 * 10,
      ...options
    })
  }

  async deleteS3Object(key: string) {
    return lib.deleteObject(this.s3Client, {
      bucket: this.config.bucket,
      key
    })
  }

  async deleteByUrl(url: string) {
    const baseUrl = `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/`
    if (!url.startsWith(baseUrl)) return
    const key = url.slice(baseUrl.length)
    return lib.deleteObject(this.s3Client, { bucket: this.config.bucket, key })
  }

  // async copyObject(options: {
  //   sourceKey: string
  //   targetKey?: string
  //   targetFileName?: string
  //   prefix?: string
  // }): Promise<string | null> {
  //   const { sourceKey, targetKey = options.sourceKey, targetFileName, prefix = '' } = options
  //   return lib.copyObject(this.s3Client, {
  //     sourceBucket: this.config.bucket,
  //     sourceKey,
  //     targetBucket: this.config.bucket,
  //     targetKey: prefix ? `${prefix}/${targetKey}` : targetKey,
  //     targetFileName
  //   })
  // }

  // async getS3Metadata(path: string, secure = true) {
  //   return lib.getS3Metadata(this.s3Client, {
  //     bucket: this.config.bucket,
  //     path,
  //     bucketPath: this.config.bucketPath
  //   })
  // }

  // async getS3Object(key: string, secure?: boolean) {
  //   try {
  //     return await lib.getS3Object(this.s3Client, this.config.bucket, key)
  //   } catch (e) {
  //     throw e
  //   }
  // }

  // async putS3Object(options: {
  //   targetKey: string
  //   data: any
  //   contentType: string
  //   contentLength: number
  //   secure?: boolean
  //   metadata?: Record<string, string>
  // }) {
  //   const { secure, ...rest } = options
  //   return lib.putS3Object(this.s3Client, {
  //     bucket: this.config.bucket,
  //     ...rest
  //   })
  // }

  // async uploadS3(options: {
  //   targetKey: string
  //   data: any
  //   contentType?: string
  //   contentEncoding?: string
  //   contentDisposition?: string
  //   secure?: boolean
  // }) {
  //   const { secure, ...rest } = options
  //   return lib.upload(this.s3Client, {
  //     bucket: this.config.bucket,
  //     ...rest
  //   })
  // }
}

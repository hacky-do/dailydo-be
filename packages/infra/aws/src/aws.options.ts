import { type ModuleMetadata } from '@nestjs/common'

export interface AwsModuleOptions {
  region: string
  bucket: string
  uploadPrefix: string
  // bucketPath: string
  accessKeyId?: string
  secretAccessKey?: string
}

export interface AwsModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => Promise<AwsModuleOptions> | AwsModuleOptions
  inject?: any[]
}

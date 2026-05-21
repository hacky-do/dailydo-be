import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { createPresignedPost, PresignedPostOptions } from '@aws-sdk/s3-presigned-post'
import { BadRequestException, NotFoundException } from '@nestjs/common'

async function copyObject(
  s3Client: S3Client,
  options: {
    sourceBucket: string
    sourceKey: string
    targetBucket: string
    targetKey: string
    targetFileName?: string
  }
): Promise<string | null> {
  const { sourceBucket, sourceKey, targetBucket, targetKey, targetFileName } = options
  try {
    const command = new CopyObjectCommand({
      Bucket: targetBucket,
      CopySource: `${sourceBucket}/${sourceKey.normalize('NFC')}`,
      Key: targetKey.normalize('NFC')
    })
    if (targetFileName) {
      const attachmentName = encodeURIComponent(targetFileName.normalize('NFC'))
      command.input.MetadataDirective = 'REPLACE'
      command.input.ContentDisposition = `attachment; filename="${attachmentName}"; filename*=UTF-8''"${attachmentName}"`
    }

    await s3Client.send(command)
    return targetKey
  } catch (e) {
    if (e.name === 'NoSuchKey') throw new NotFoundException(`${sourceKey} not found`)
    throw e
  }
}

async function getS3Metadata(
  s3Client: S3Client,
  options: { path: string; bucket: string; bucketPath: string; cloudfront?: string; forCloudfront?: boolean }
) {
  const { path, bucket, cloudfront, bucketPath, forCloudfront } = options
  try {
    let key = path
    if (forCloudfront) key = key.replace(cloudfront + '/', bucketPath)
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key
    })
    return await s3Client.send(command)
  } catch (e) {
    if (e.name === 'NotFound') {
      throw new NotFoundException(`s3: ${path} not found`)
    }
    throw e
  }
}

async function deleteObject(s3Client: S3Client, options: { bucket: string; key: string }) {
  const { bucket, key } = options
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    })
    return await s3Client.send(command)
  } catch (e) {
    throw e
  }
}

async function generatePreSignedUrl(
  s3Client: S3Client,
  options: {
    bucket: string
    contentType: string
    key: string
    fileName?: string
    maxFileSize: number
  }
): Promise<{ path: string; url: string; fields: Record<string, string> }> {
  const { key, contentType, bucket, maxFileSize, fileName } = options
  const normalizedKey = key.normalize('NFC')
  const conditions: PresignedPostOptions['Conditions'] = [['eq', '$Content-Type', contentType]]
  conditions.push(['content-length-range', 0, maxFileSize])

  const fields: PresignedPostOptions['Fields'] = { 'Content-Type': contentType }
  if (fileName) {
    fields['Content-Disposition'] =
      `attachment; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''"${encodeURIComponent(fileName)}"`
  }

  const ret = await createPresignedPost(s3Client, {
    Bucket: bucket,
    Key: normalizedKey,
    Conditions: conditions,
    Fields: fields,
    Expires: 3600
  })
  return { path: normalizedKey, url: ret.url, fields: ret.fields }
}

// async function generatePreSignedUrl(
//   s3Client: S3Client,
//   options: {
//     bucket: string
//     type: 'image' | 'file'
//     contentType: string
//     key: string
//     fileName?: string
//     maxFileSize: number
//     imageDimension?: {
//       width: number
//       height: number
//     }
//   }
// ): Promise<{ path: string; url: string; fields: Record<string, string> }> {
//   const { type, key, contentType, imageDimension, bucket, maxFileSize, fileName } = options
//   try {
//     const normalizedKey = key.normalize('NFC')
//     const conditions: PresignedPostOptions['Conditions'] = [['eq', '$Content-Type', contentType]]
//     conditions.push(['content-length-range', 0, maxFileSize])
//
//     const fields: PresignedPostOptions['Fields'] = {}
//     if (type === 'image') {
//       if (!imageDimension?.width || !imageDimension?.height) throw new BadRequestException('dimension_required')
//       fields['x-amz-meta-width'] = imageDimension.width.toString()
//       fields['x-amz-meta-height'] = imageDimension.height.toString()
//     }
//     if (fileName) {
//       fields['Content-Disposition'] =
//         `attachment; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''"${encodeURIComponent(fileName)}"`
//     }
//
//     const ret = await createPresignedPost(s3Client, {
//       Bucket: bucket,
//       Key: normalizedKey,
//       Conditions: conditions,
//       Fields: fields,
//       Expires: 3600
//     })
//     return { path: normalizedKey, url: ret.url, fields: ret.fields }
//   } catch (e) {
//     throw e
//   }
// }

async function getS3Object(s3Client: S3Client, bucket: string, key: string) {
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key })
    return await s3Client.send(command)
  } catch (e) {
    throw e
  }
}

async function putS3Object(
  s3Client: S3Client,
  options: {
    bucket: string
    targetKey: string
    data: any
    contentType: string
    contentLength: number
    metadata?: Record<string, string>
  }
) {
  const { bucket, targetKey, data, contentType, contentLength, metadata } = options

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: targetKey,
    Body: data,
    ContentType: contentType,
    ContentLength: contentLength,
    Metadata: metadata
  })
  return await s3Client.send(command)
}

async function upload(
  s3Client: S3Client,
  options: {
    bucket: string
    targetKey: string
    contentType?: string
    contentEncoding?: string
    contentDisposition?: string
    data: any
  }
) {
  const { bucket, targetKey, contentType, contentEncoding, contentDisposition, data } = options

  const parallelUploads3 = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: targetKey,
      Body: data,
      ContentType: contentType,
      ContentEncoding: contentEncoding,
      ContentDisposition: contentDisposition
    },
    leavePartsOnError: false
  })

  return await parallelUploads3.done()
}

export { copyObject, generatePreSignedUrl, getS3Object, getS3Metadata, putS3Object, deleteObject, upload }

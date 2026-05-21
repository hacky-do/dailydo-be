import { User } from '@data/decorators'
import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AwsService } from '@infra/aws'
import mime from 'mime-types'
import crypto from 'node:crypto'
import { GetFilesUploadReqDto } from './dto/req/get-files-upload.req.dto'
// import { PostFilesUploadReqDto } from './dto/req/post-files-upload.req.dto'
import { GetFilesUploadResDto } from './dto/res/get-files-upload.res.dto'
// import { PostFilesUploadResDto } from './dto/res/post-files-upload.res.dto'

@ApiTags('파일')
@Controller('files')
export class FilesController {
  constructor(
    private readonly awsService: AwsService,
    private readonly configService: ConfigService
  ) {}

  @Get('upload')
  @ApiOperation({ summary: '이미지 업로드용 Presigned URL 조회' })
  @ApiResponse({ status: 200, type: GetFilesUploadResDto })
  async getUpload(@User('id') userId: number, @Query() params: GetFilesUploadReqDto): Promise<GetFilesUploadResDto> {
    const { mimeType, fileName } = params
    if (!mimeType.startsWith('image/')) {
      throw new BadRequestException('mime_type_should_be_image')
    }
    const extensions = mime.extensions[mimeType]
    if (!extensions?.length) {
      throw new BadRequestException('unsupported_mime_type')
    }
    const key = `${userId}/${crypto.randomUUID()}.${extensions[0]}`
    return this.awsService.generatePreSignedUrl({ key, contentType: mimeType, fileName })
  }

  // ── 기존 방식 (2단계: presigned URL 발급 → copyObject로 최종 저장) ──────────

  // @Public()
  // @Get('upload')
  // @ApiOperation({ summary: '업로드할 URL 조회' })
  // @ApiResponse({ status: 200, type: GetFilesUploadResDto })
  // async getUpload(@Query() params: GetFilesUploadReqDto): Promise<GetFilesUploadResDto> {
  //   const { mimeType, type, fileName, width, height } = params
  //   const extensions = mime.extensions[mimeType]
  //   if (type === 'image' && !mimeType.startsWith('image/')) {
  //     throw new BadRequestException('mime_type_should_be_image')
  //   } else if (type === 'file' && mimeType.startsWith('image/')) {
  //     throw new BadRequestException('type_should_not_be_image')
  //   }
  //   const key = `${crypto.randomUUID()}.${extensions[0]}`
  //   return this.awsService.generatePreSignedUrl({
  //     type: params.type,
  //     fileName,
  //     key,
  //     contentType: mimeType,
  //     imageDimension: { width, height }
  //   })
  // }

  // @Public()
  // @Post('upload')
  // @ApiOperation({ summary: '임시 파일 저장' })
  // @ApiResponse({ status: 201, type: PostFilesUploadResDto })
  // async postUpload(@User('id') userId: number, @Body() data: PostFilesUploadReqDto): Promise<PostFilesUploadResDto> {
  //   let prefix = `${data.type}s/${data.kind}`
  //   if (data.kind === 'users' && userId) {
  //     prefix = `${prefix}/${userId}`
  //   }
  //   const path = await this.awsService.copyObject({ sourceKey: data.path, prefix })
  //   return { url: `${this.configService.get('aws.cloudfront')}/${path}` }
  // }
}

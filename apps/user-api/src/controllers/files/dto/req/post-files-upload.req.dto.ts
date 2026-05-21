import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsString } from 'class-validator'

export enum PostFilesUploadReqDtoKind {
  users = 'users',
  etc = 'etc'
}

export class PostFilesUploadReqDto {
  // @IsEnum(FileUploadType)
  // @ApiProperty({ title: '파일 타입', enum: FileUploadType })
  // type: FileUploadType

  @IsEnum(PostFilesUploadReqDtoKind)
  @ApiProperty({ title: '파일 종류 - 저장 시 경로의 prefix로 사용', enum: PostFilesUploadReqDtoKind })
  kind: PostFilesUploadReqDtoKind

  @IsString()
  @ApiProperty({ title: '저장소의 파일 경로' })
  path: string

  constructor(partial: Partial<PostFilesUploadReqDto>) {
    Object.assign(this, partial)
  }
}

import { ApiProperty } from '@nestjs/swagger'
// import { Type } from 'class-transformer'
// import { IsEnum, IsInt, Min } from 'class-validator'
import { IsOptional, IsString, IsMimeType } from 'class-validator'

// export enum FileUploadType {
//   image = 'image',
//   file = 'file'
// }

export class GetFilesUploadReqDto {
  // @IsEnum(FileUploadType)
  // @ApiProperty({ description: '파일 타입' })
  // type: FileUploadType

  @IsMimeType()
  @ApiProperty({ description: '파일 MIME 타입 (image/* 만 허용)' })
  mimeType: string

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '파일 이름', required: false })
  fileName?: string

  // @Type(() => Number)
  // @IsOptional()
  // @IsInt()
  // @Min(0)
  // @ApiProperty({ description: '이미지 가로' })
  // width?: number

  // @Type(() => Number)
  // @IsOptional()
  // @IsInt()
  // @Min(0)
  // @ApiProperty({ description: '이미지 높이', format: 'int32' })
  // height?: number

  constructor(partial: Partial<GetFilesUploadReqDto>) {
    Object.assign(this, partial)
  }
}
